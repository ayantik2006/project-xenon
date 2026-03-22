import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Message from "@/models/Message";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, email, subject, content, userId, type = "query" } = await req.json();

    // Find first admin
    const admin = await User.findOne({ role: "admin" }).select("_id");
    if (!admin) {
      return NextResponse.json({ error: "No admin found" }, { status: 404 });
    }

    const newMessage = await Message.create({
      sender: userId || null,
      receiver: admin._id,
      name: name || null,
      email: email || null,
      subject: subject || "No Subject",
      content,
      type,
    });

    return NextResponse.json(
      { message: "Query sent successfully!", data: newMessage },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
