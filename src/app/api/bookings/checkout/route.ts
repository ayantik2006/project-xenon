import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Hoarding from '@/models/Hoarding';
import { razorpay } from '@/lib/razorpay';
import { verifyAccessToken } from '@/lib/jwt';
import {
  calculateCampaignPricing,
  getPlatformPricingSettings,
} from "@/lib/platformPricing";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { hoardingId, startDate, endDate } = body;

    if (!hoardingId || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const hoarding = await Hoarding.findById(hoardingId);
    if (!hoarding) {
      return NextResponse.json({ error: "Hoarding not found" }, { status: 404 });
    }

    if (hoarding.status !== 'approved') {
      return NextResponse.json({ error: "Hoarding is not available for booking" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    // Check for overlapping confirmed bookings
    const overlap = await Booking.findOne({
      hoarding: hoardingId,
      status: 'confirmed',
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });
    if (overlap) {
      return NextResponse.json({ error: "Selected dates are already booked." }, { status: 400 });
    }

    // Check for manual blocks in hoarding collection
    if (hoarding.availability?.blockedDates) {
      const isBlocked = hoarding.availability.blockedDates.some((block: any) => {
        const bStart = new Date(block.startDate);
        const bEnd = new Date(block.endDate);
        return bStart <= end && bEnd >= start;
      });
      if (isBlocked) {
        return NextResponse.json({ error: "Selected dates are unavailable/blocked by vendor." }, { status: 400 });
      }
    }

    // Optional: Check for recently created pending bookings to avoid race conditions
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentPending = await Booking.findOne({
      hoarding: hoardingId,
      status: 'pending',
      createdAt: { $gte: tenMinutesAgo },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });
    if (recentPending) {
       return NextResponse.json({ error: "Selected dates are temporarily held for another user's checkout. Try again in 10 minutes." }, { status: 400 });
    }

    const settings = await getPlatformPricingSettings();
    const pricing = calculateCampaignPricing(
      hoarding.pricePerMonth,
      diffDays,
      settings,
    );
    const amount = pricing.totalAmount;

    const minAmount = hoarding.minimumBookingAmount || 0;
    if (amount < minAmount) {
      return NextResponse.json(
        { error: `Minimum booking amount is ₹${minAmount}` },
        { status: 400 }
      );
    }

    const options = {
      amount: Math.round(amount * 100), 
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const booking = await Booking.create({
      hoarding: hoardingId,
      user: payload.userId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalAmount: amount,
      platformFee: pricing.platformFee,
      vendorAmount: pricing.vendorBaseAmount,
      status: 'pending',
      orderId: order.id
    });

    return NextResponse.json({
      orderId: order.id,
      bookingId: booking._id,
      amount: options.amount,
      currency: options.currency
    });

  } catch (error: any) {
    console.error("Payment Init Error:", error);
    return NextResponse.json({ error: error.message || "Payment initiation failed" }, { status: 500 });
  }
}
