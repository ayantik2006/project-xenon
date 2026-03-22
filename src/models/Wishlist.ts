import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One wishlist per user
    },
    hoardings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hoarding",
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.Wishlist ||
  mongoose.model("Wishlist", WishlistSchema);
