import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Hoarding from '@/models/Hoarding';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();

        // 1. Fetch confirmed bookings
        const bookings = await Booking.find({
            hoarding: id,
            status: 'confirmed'
        }).select('startDate endDate');

        // 2. Fetch hoarding for manual blocks
        const hoarding = await Hoarding.findById(id).select('availability.blockedDates');

        const blockedRanges = [
            ...bookings.map(b => ({
                startDate: b.startDate,
                endDate: b.endDate,
                type: 'booking'
            })),
            ...(hoarding?.availability?.blockedDates || []).map((b: any) => ({
                startDate: b.startDate,
                endDate: b.endDate,
                type: 'manual',
                reason: b.reason || "",
            }))
        ];

        return NextResponse.json({ blockedRanges });

    } catch (error: any) {
        console.error("Availability Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findById(payload.userId);
        if (!user || user.role !== "vendor") {
            return NextResponse.json({ error: "Only vendors can block dates" }, { status: 403 });
        }

        const hoarding = await Hoarding.findById(id);
        if (!hoarding) {
            return NextResponse.json({ error: "Hoarding not found" }, { status: 404 });
        }

        if (hoarding.owner.toString() !== user._id.toString()) {
            return NextResponse.json({ error: "You can only manage your own listing availability" }, { status: 403 });
        }

        const body = await req.json();
        const startDate = new Date(body.startDate);
        const endDate = new Date(body.endDate);
        const reason = typeof body.reason === "string" ? body.reason.trim() : "";

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return NextResponse.json({ error: "Valid start and end dates are required" }, { status: 400 });
        }

        if (startDate > endDate) {
            return NextResponse.json({ error: "Start date cannot be after end date" }, { status: 400 });
        }

        const overlappingBooking = await Booking.findOne({
            hoarding: id,
            status: 'confirmed',
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
        }).select("_id");

        if (overlappingBooking) {
            return NextResponse.json(
                { error: "Cannot block dates that overlap with a confirmed booking" },
                { status: 400 },
            );
        }

        const existingManualBlock = (hoarding.availability?.blockedDates || []).some((block: any) => {
            const blockStart = new Date(block.startDate);
            const blockEnd = new Date(block.endDate);
            return blockStart <= endDate && blockEnd >= startDate;
        });

        if (existingManualBlock) {
            return NextResponse.json(
                { error: "This date range overlaps with an existing manual block" },
                { status: 400 },
            );
        }

        if (!hoarding.availability) {
            hoarding.availability = { blockedDates: [] };
        }

        hoarding.availability.blockedDates.push({ startDate, endDate, reason });
        await hoarding.save();

        return NextResponse.json({
            message: "Dates blocked successfully",
            blockedRange: {
                startDate,
                endDate,
                type: "manual",
                reason,
            },
        });
    } catch (error: any) {
        console.error("Availability Block Error:", error);
        return NextResponse.json({ error: "Failed to block dates" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findById(payload.userId);
        if (!user || user.role !== "vendor") {
            return NextResponse.json({ error: "Only vendors can unblock dates" }, { status: 403 });
        }

        const hoarding = await Hoarding.findById(id);
        if (!hoarding) {
            return NextResponse.json({ error: "Hoarding not found" }, { status: 404 });
        }

        if (hoarding.owner.toString() !== user._id.toString()) {
            return NextResponse.json({ error: "You can only manage your own listing availability" }, { status: 403 });
        }

        const body = await req.json();
        const startDate = new Date(body.startDate);
        const endDate = new Date(body.endDate);

        const currentBlocks = hoarding.availability?.blockedDates || [];
        hoarding.availability.blockedDates = currentBlocks.filter((block: any) => {
            const sameStart = new Date(block.startDate).getTime() === startDate.getTime();
            const sameEnd = new Date(block.endDate).getTime() === endDate.getTime();
            return !(sameStart && sameEnd);
        });

        await hoarding.save();

        return NextResponse.json({ message: "Blocked dates removed successfully" });
    } catch (error: any) {
        console.error("Availability Unblock Error:", error);
        return NextResponse.json({ error: "Failed to remove blocked dates" }, { status: 500 });
    }
}
