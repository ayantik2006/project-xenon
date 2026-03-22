import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Hoarding from '@/models/Hoarding';
import { razorpay } from '@/lib/razorpay';
import { verifyAccessToken } from '@/lib/jwt';

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

    const vendorBaseAmount = Math.ceil((hoarding.pricePerMonth / 30) * diffDays);
    const commission = vendorBaseAmount * 0.20;
    const subtotal = vendorBaseAmount + commission;
    const gatewayCharges = subtotal * 0.025;
    const gst = subtotal * 0.025;
    const amount = Math.ceil(subtotal + gatewayCharges + gst);

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
      platformFee: Math.ceil(commission + gatewayCharges + gst),
      vendorAmount: vendorBaseAmount,
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
