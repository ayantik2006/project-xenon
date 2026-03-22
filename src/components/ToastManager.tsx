"use client";

import { useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";

export default function ToastManager() {
  const toastFired = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorMsg = params.get("error");
      
      if (errorMsg === "Please register first" && !toastFired.current) {
        toastFired.current = true;
        
        // Allow the toast container to mount before triggering the first toast.
        setTimeout(() => {
          toast.error(errorMsg, {
            autoClose: 4000,
          });
        }, 100);
        
        // Clean URL softly
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  return <ToastContainer position="top-right" />;
}
