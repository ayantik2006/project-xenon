import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import Hoarding from '@/models/Hoarding';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import { hoardingSchema } from '@/lib/validators/hoarding';
import {
  getPlatformPricingSettings,
  withBuyerFacingPricing,
} from "@/lib/platformPricing";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
   try {
      const { id } = await params; // Awaiting params for Next.js 16/future proofing
      await dbConnect();

      const hoarding = await Hoarding.findById(id).populate('owner', 'name email');

      if (!hoarding) {
         return NextResponse.json({ error: "Hoarding not found" }, { status: 404 });
      }

      const cookieStore = await cookies();
      const token = cookieStore.get("accessToken")?.value;
      let viewerRole: string | null = null;

      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          const user = await User.findById(payload.userId);
          viewerRole = user?.role || null;
        }
      }

      const settings = await getPlatformPricingSettings();
      const plainHoarding = hoarding.toObject();
      const serializedHoarding =
        viewerRole === "admin" || viewerRole === "vendor"
          ? plainHoarding
          : withBuyerFacingPricing(plainHoarding, settings);

      return NextResponse.json({ hoarding: serializedHoarding, pricingSettings: settings });
   } catch (error) {
      return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
   }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
   try {
      const { id } = await params;
      const cookieStore = await cookies();
      const token = cookieStore.get('accessToken')?.value;

      if (!token) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const payload = verifyToken(token);
      if (!payload) {
         return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      await dbConnect();
      const user = await User.findById(payload.userId);

      if (!user || user.role !== 'vendor') {
         return NextResponse.json({ error: "Only vendors can update hoardings" }, { status: 403 });
      }

      // Find the hoarding
      const hoarding = await Hoarding.findById(id);
      if (!hoarding) {
         return NextResponse.json({ error: "Hoarding not found" }, { status: 404 });
      }

      // Verify ownership
      if (hoarding.owner.toString() !== user._id.toString()) {
         return NextResponse.json({ error: "You can only edit your own hoardings" }, { status: 403 });
      }

      const body = await req.json();
      const result = hoardingSchema.safeParse(body);

      if (!result.success) {
         return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
      }

      const data = result.data;

      // Update the hoarding
      hoarding.name = data.name;
      hoarding.description = data.description;
      hoarding.location = {
         address: data.address,
         city: data.city,
         area: data.area,
         state: data.state,
         zipCode: data.zipCode,
         ...((data.latitude && data.longitude) ? { coordinates: { lat: data.latitude, lng: data.longitude } } : {})
      };
      hoarding.dimensions = {
         width: data.width,
         height: data.height
      };
      hoarding.type = data.type;
      hoarding.lightingType = data.lightingType;
      hoarding.pricePerMonth = data.pricePerMonth;
      hoarding.minimumBookingAmount = data.minimumBookingAmount || 0;
      hoarding.hoardingCode = data.hoardingCode;
      hoarding.trafficFrom = data.trafficFrom;
      hoarding.uniqueReach = data.uniqueReach;
      hoarding.uniqueFootfall = data.uniqueFootfall;
      hoarding.images = data.images || [];

      await hoarding.save();

      return NextResponse.json({ message: "Hoarding updated successfully", hoarding }, { status: 200 });

   } catch (error: any) {
      console.error("Update Hoarding Error:", error);
      return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
   }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
   try {
      const { id } = await params;
      const cookieStore = await cookies();
      const token = cookieStore.get('accessToken')?.value;

      if (!token) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const payload = verifyToken(token);
      if (!payload) {
         return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      await dbConnect();
      const user = await User.findById(payload.userId);

      if (!user || user.role !== 'vendor') {
         return NextResponse.json({ error: "Only vendors can delete hoardings" }, { status: 403 });
      }

      // Find the hoarding
      const hoarding = await Hoarding.findById(id);
      if (!hoarding) {
         return NextResponse.json({ error: "Hoarding not found" }, { status: 404 });
      }

      // Verify ownership
      if (hoarding.owner.toString() !== user._id.toString()) {
         return NextResponse.json({ error: "You can only delete your own hoardings" }, { status: 403 });
      }

      await Hoarding.findByIdAndDelete(id);

      return NextResponse.json({ message: "Hoarding deleted successfully" }, { status: 200 });

   } catch (error: any) {
      console.error("Delete Hoarding Error:", error);
      return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
   }
}
