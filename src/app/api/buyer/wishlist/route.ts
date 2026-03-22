import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import dbConnect from "@/lib/dbConnect";
import Wishlist from "@/models/Wishlist";
import Hoarding from "@/models/Hoarding";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    console.log("[Wishlist GET] Access Token:", token ? "Found" : "Missing");

    const decoded = verifyAccessToken(token as string);
    if (!decoded) {
      console.warn("[Wishlist GET] Invalid or expired token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    console.log("[Wishlist GET] Decoded User:", decoded.userId, "Role:", decoded.role);
    await dbConnect();

    const wishlist = await Wishlist.findOne({ user: decoded.userId }).populate({
      path: "hoardings",
      populate: { path: "owner", select: "name" },
    });

    return NextResponse.json({ wishlist: wishlist || { hoardings: [] } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    console.log("[Wishlist POST] Access Token:", token ? "Found" : "Missing");

    const decoded = verifyAccessToken(token as string);
    if (!decoded) {
      console.warn("[Wishlist POST] Invalid or expired token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    console.log("[Wishlist POST] Decoded User:", decoded.userId, "Role:", decoded.role);
    const { hoardingId } = await req.json();

    if (!hoardingId) {
      return NextResponse.json({ error: "Missing hoardingId" }, { status: 400 });
    }

    await dbConnect();

    // Check if hoarding exists
    const hoarding = await Hoarding.findById(hoardingId);
    if (!hoarding) {
      return NextResponse.json({ error: "Hoarding not found" }, { status: 404 });
    }

    let wishlist = await Wishlist.findOne({ user: decoded.userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: decoded.userId,
        hoardings: [hoardingId],
      });
    } else {
      if (!wishlist.hoardings.includes(hoardingId)) {
        wishlist.hoardings.push(hoardingId);
        await wishlist.save();
      }
    }

    return NextResponse.json({ message: "Added to wishlist", wishlist });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    console.log("[Wishlist DELETE] Access Token:", token ? "Found" : "Missing");

    const decoded = verifyAccessToken(token as string);
    if (!decoded) {
      console.warn("[Wishlist DELETE] Invalid or expired token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    console.log("[Wishlist DELETE] Decoded User:", decoded.userId, "Role:", decoded.role);
    const { hoardingId } = await req.json();

    if (!hoardingId) {
       return NextResponse.json({ error: "Missing hoardingId" }, { status: 400 });
    }

    await dbConnect();

    const wishlist = await Wishlist.findOne({ user: decoded.userId });
    if (wishlist) {
      wishlist.hoardings = wishlist.hoardings.filter(
        (id: any) => id.toString() !== hoardingId,
      );
      await wishlist.save();
    }

    return NextResponse.json({ message: "Removed from wishlist", wishlist });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
