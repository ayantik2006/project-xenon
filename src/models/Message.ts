import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Null for guest queries
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Typically the admin
    },
    name: {
      type: String, // For guest queries
      required: false,
    },
    email: {
      type: String, // For guest queries
      required: false,
    },
    subject: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
    },
    type: {
      type: String,
      enum: ["chat", "query"],
      default: "chat",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
