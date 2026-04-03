"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, User, Bot } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface WidgetMessage {
  id: string;
  text: string;
  sender: "user" | "admin" | "bot";
  time: string;
  isUnread?: boolean;
}

interface AuthUser {
  id: string;
  role: string;
  name: string;
}

interface ApiMessageParty {
  _id: string;
  role?: string;
  name?: string;
}

interface ApiMessage {
  _id: string;
  content: string;
  createdAt: string;
  status: "unread" | "read" | "archived";
  sender?: string | ApiMessageParty | null;
  receiver?: string | ApiMessageParty | null;
}

const formatChatTime = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

export default function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [adminMessages, setAdminMessages] = useState<WidgetMessage[]>([]);
  const [adminChatLoading, setAdminChatLoading] = useState(false);
  const [adminChatError, setAdminChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [adminMessages, isOpen]);

  useEffect(() => {
    // Listen for custom "open-support-chat" event
    const handleOpenSupportChat = (e: any) => {
      setIsOpen(true);
    };

    window.addEventListener("hoardspace-open-support-chat", handleOpenSupportChat);
    return () => window.removeEventListener("hoardspace-open-support-chat", handleOpenSupportChat);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadAuthUser = async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          if (!isCancelled) {
            setAuthUser(null);
          }
          return;
        }

        const data = await res.json();
        if (!isCancelled) {
          setAuthUser(data.user ?? null);
        }
      } catch (error) {
        if (!isCancelled) {
          setAuthUser(null);
        }
      }
    };

    loadAuthUser();

    return () => {
      isCancelled = true;
    };
  }, []);

  const canUseAdminChat =
    authUser?.role === "buyer" || authUser?.role === "vendor";

  const mapApiMessageToWidgetMessage = (message: ApiMessage): WidgetMessage => {
    const senderId =
      typeof message.sender === "string" ? message.sender : message.sender?._id;
    const senderRole =
      typeof message.sender === "string" ? undefined : message.sender?.role;
    const isOwnMessage = senderId === authUser?.id;

    return {
      id: message._id,
      text: message.content,
      sender: isOwnMessage || senderRole !== "admin" ? "user" : "admin",
      time: formatChatTime(new Date(message.createdAt)),
      isUnread:
        !isOwnMessage &&
        senderRole === "admin" &&
        message.status === "unread",
    };
  };

  const fetchAdminThread = async () => {
    if (!canUseAdminChat) {
      setAdminMessages([]);
      return;
    }

    setAdminChatLoading(true);
    try {
      const res = await fetchWithAuth("/api/messages");
      if (!res.ok) {
        throw new Error("Failed to fetch support messages");
      }

      const data = await res.json();
      setAdminMessages(
        (data.messages || []).map((message: ApiMessage) =>
          mapApiMessageToWidgetMessage(message),
        ),
      );
      setAdminChatError(null);
    } catch (error) {
      setAdminChatError("Could not load support chat right now.");
    } finally {
      setAdminChatLoading(false);
    }
  };

  useEffect(() => {
    if (!canUseAdminChat) {
      return;
    }

    fetchAdminThread();

    const interval = setInterval(() => {
      fetchAdminThread();
    }, 5000);

    return () => clearInterval(interval);
  }, [canUseAdminChat]);



  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageInput.trim()) return;

    if (!canUseAdminChat || adminChatLoading) return;

    const content = messageInput.trim();
    setMessageInput("");

    try {
      const res = await fetchWithAuth("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        throw new Error("Failed to send support message");
      }

      const data = await res.json();
      setAdminMessages((prev) => [
        ...prev,
        mapApiMessageToWidgetMessage(data.data as ApiMessage),
      ]);
      setAdminChatError(null);
    } catch (error) {
      setMessageInput(content);
      setAdminChatError("Could not send your message. Please try again.");
    }
  };

  const currentMessages = adminMessages;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div
          className="mb-4 flex h-[480px] w-80 flex-col overflow-hidden rounded-2xl bg-[#efeae2] shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:w-96"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          <div className="relative z-10 flex w-full shrink-0 flex-col bg-[#0f4a8a] pb-0 pt-3 text-white shadow-md">
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold leading-tight">HoardSpace Support</h3>
                  <p className="mt-0.5 text-[12px] font-medium tracking-wide text-blue-100 opacity-90">
                    {canUseAdminChat
                      ? "Replies from the admin team"
                      : "Login to message support"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="self-start rounded-full p-2 transition-colors hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>


          </div>

          <div className="relative flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            <div
              className="pointer-events-none absolute inset-0 bg-repeat opacity-[0.03]"
              style={{
                backgroundImage:
                  "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h20v20H0z\" fill=\"%23000\"/%3E%3Ccircle cx=\"10\" cy=\"10\" r=\"1.5\" fill=\"%23000\"/%3E%3C/svg%3E')",
                backgroundSize: "20px",
              }}
            ></div>

            <div className="mb-4 text-center">
              <span className="rounded-lg bg-[#e4e2dd] px-3 py-1 text-[11px] font-medium text-gray-600">
                Today
              </span>
            </div>

            {adminChatLoading && currentMessages.length === 0 && (
              <div className="relative z-10 text-center text-sm text-gray-500">
                Loading support chat...
              </div>
            )}

            {adminChatError && (
              <div className="relative z-10 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {adminChatError}
              </div>
            )}

            {!canUseAdminChat && (
              <div className="relative z-10 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Sign in as a buyer or vendor to chat with the admin team here.
              </div>
            )}

            {canUseAdminChat &&
              currentMessages.length === 0 &&
              !adminChatLoading && (
                <div className="relative z-10 text-center text-sm text-gray-500">
                  Start a conversation with the admin team.
                </div>
              )}

            {currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`relative z-10 mb-1 flex max-w-[85%] flex-col ${
                  msg.sender === "user"
                    ? "self-end items-end"
                    : "self-start items-start"
                }`}
              >
                <div
                  className={`relative break-words rounded-lg px-3 pb-1.5 pt-2 shadow-sm ${
                    msg.sender === "user"
                      ? "rounded-tr-[4px] bg-[#dbeafe] text-[#111b21]"
                      : "rounded-tl-[4px] bg-white text-[#111b21]"
                  }`}
                >
                  <div
                    className="absolute top-0 h-0 w-0 border-[6px]"
                    style={{
                      borderColor:
                        msg.sender === "user"
                          ? "#dbeafe transparent transparent transparent"
                          : "#ffffff transparent transparent transparent",
                      right: msg.sender === "user" ? "-6px" : "auto",
                      left: msg.sender === "user" ? "auto" : "-6px",
                    }}
                  ></div>

                  <p className="text-[14px] leading-snug">{msg.text}</p>
                  <div className="relative -bottom-[2px] float-right ml-4 mt-1 text-[10px] text-gray-500">
                    {msg.time}
                    {msg.sender === "user" && (
                      <span className="ml-[3px] inline-block font-bold text-blue-500">
                        ✓✓
                      </span>
                    )}
                    {msg.sender === "admin" && msg.isUnread && (
                      <span className="ml-[4px] inline-block h-2 w-2 rounded-full bg-orange-500"></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-[#f0f2f5] p-3">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={
                  !canUseAdminChat
                    ? "Login required for admin chat"
                    : "Type a message"
                }
                disabled={!canUseAdminChat}
                className="flex-1 rounded-full border border-transparent bg-white px-5 py-3 text-[15px] text-gray-800 shadow-sm outline-none transition-colors placeholder:text-gray-500 focus:border-blue-100"
              />
              <button
                type="submit"
                disabled={
                  !messageInput.trim() || !canUseAdminChat
                }
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#f97316] text-white shadow-sm transition-colors hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <Send size={18} className="translate-x-[2px]" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0f4a8a] text-white shadow-2xl transition-all duration-300 hover:bg-[#1e3a8a] hover:shadow-[0_10px_25px_rgba(15,74,138,0.5)] ${
          isOpen ? "rotate-90 scale-90" : "scale-100 hover:-translate-y-1"
        }`}
      >
        <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#f97316] shadow-sm"></span>
        <div className="relative flex h-full w-full items-center justify-center">
          <MessageCircle
            size={28}
            className={`absolute transition-opacity duration-300 ${
              isOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <X
            size={28}
            className={`absolute transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </button>
    </div>
  );
}
