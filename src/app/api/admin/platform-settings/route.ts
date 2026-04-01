import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import PlatformSettings from "@/models/PlatformSettings";
import { verifyToken } from "@/lib/jwt";
import {
  DEFAULT_PLATFORM_PRICING,
  getPlatformPricingSettings,
} from "@/lib/platformPricing";

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  await dbConnect();
  const user = await User.findById(payload.userId);
  return user?.role === "admin" ? user : null;
}

export async function GET() {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getPlatformPricingSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Platform settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to load platform settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const nextCommission = Number(body.hoardspaceCommissionPercent);

    if (Number.isNaN(nextCommission) || nextCommission < 0) {
      return NextResponse.json(
        { error: "Commission must be a non-negative number" },
        { status: 400 },
      );
    }

    const settings = await PlatformSettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          hoardspaceCommissionPercent: nextCommission,
          razorpayPercent: DEFAULT_PLATFORM_PRICING.razorpayPercent,
          gstPercent: DEFAULT_PLATFORM_PRICING.gstPercent,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({
      message: "Platform pricing updated successfully",
      settings: {
        hoardspaceCommissionPercent: settings?.hoardspaceCommissionPercent ?? 0,
        razorpayPercent:
          settings?.razorpayPercent ?? DEFAULT_PLATFORM_PRICING.razorpayPercent,
        gstPercent: settings?.gstPercent ?? DEFAULT_PLATFORM_PRICING.gstPercent,
      },
    });
  } catch (error) {
    console.error("Platform settings PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update platform settings" },
      { status: 500 },
    );
  }
}
