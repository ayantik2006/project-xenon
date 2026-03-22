import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import cloudinary from "@/lib/cloudinary";
import { UploadApiResponse } from "cloudinary";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Cloudinary is not configured" },
        { status: 500 },
      );
    }

    await dbConnect();

    const formData = await req.formData();
    const photo = formData.get("photo");
    if (!photo || !(photo instanceof Blob)) {
      return NextResponse.json(
        { error: "No photo was provided" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await photo.arrayBuffer());

    const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "profile_photos",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Upload failed"));
          resolve(result);
        },
      );
      stream.end(buffer);
    });

    if (!uploadResult.secure_url) {
      throw new Error("Cloudinary did not return a secure URL");
    }

    const user = await User.findByIdAndUpdate(
      payload.userId,
      { image: uploadResult.secure_url },
      { new: true },
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile photo uploaded successfully.",
      imageUrl: uploadResult.secure_url,
      user,
    });
  } catch (error: unknown) {
    console.error("Profile photo upload error:", error);
    return NextResponse.json(
      { error: "Could not upload profile photo" },
      { status: 500 },
    );
  }
}
