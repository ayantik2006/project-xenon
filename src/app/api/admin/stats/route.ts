import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Hoarding from '@/models/Hoarding';
import Booking from '@/models/Booking';
import { verifyToken } from '@/lib/jwt';

// GET admin dashboard stats
export async function GET(req: Request) {
    try {
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

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
        }

        // Get statistics
        const totalUsers = await User.countDocuments();
        const totalVendors = await User.countDocuments({ role: 'vendor' });
        const totalBuyers = await User.countDocuments({ role: 'buyer' });
        const pendingKYC = await User.countDocuments({ kycStatus: 'pending' });

        const totalHoardings = await Hoarding.countDocuments();
        const approvedHoardings = await Hoarding.countDocuments({ status: 'approved' });
        const pendingHoardings = await Hoarding.countDocuments({ status: 'pending' });

        const totalBookings = await Booking.countDocuments();
        const activeBookings = await Booking.countDocuments({ paymentStatus: 'paid' });

        // Get recent activities
        const recentUsers = await User.find()
            .select('name email role createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentHoardings = await Hoarding.find()
            .populate('owner', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        return NextResponse.json({
            stats: {
                users: {
                    total: totalUsers,
                    vendors: totalVendors,
                    buyers: totalBuyers,
                    pendingKYC
                },
                hoardings: {
                    total: totalHoardings,
                    approved: approvedHoardings,
                    pending: pendingHoardings
                },
                bookings: {
                    total: totalBookings,
                    active: activeBookings
                }
            },
            recentUsers,
            recentHoardings
        }, { status: 200 });

    } catch (error: any) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
