import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Hoarding from '@/models/Hoarding';
import Booking from '@/models/Booking';
import { verifyAccessToken } from '@/lib/jwt';

// GET admin dashboard stats
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = verifyAccessToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(payload.userId);

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
        }

        // Get basic counts
        const totalUsers = await User.countDocuments();
        const totalVendors = await User.countDocuments({ role: 'vendor' });
        const totalBuyers = await User.countDocuments({ role: 'buyer' });
        const pendingKYC = await User.countDocuments({ kycStatus: 'pending' });

        const totalHoardings = await Hoarding.countDocuments();
        const approvedHoardings = await Hoarding.countDocuments({ status: 'approved' });
        const pendingHoardings = await Hoarding.countDocuments({ status: 'pending' });

        const totalBookings = await Booking.countDocuments();
        // Assume confirmed bookings are those with a payment status or just use 'confirmed' status
        const confirmedBookings = await Booking.find({ status: 'confirmed' });
        
        const totalGMV = confirmedBookings.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const platformRevenue = confirmedBookings.reduce((acc, curr) => acc + (curr.platformFee || 0), 0);

        // Get recent activities
        const recentUsers = await User.find()
            .select('name email role createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentHoardings = await Hoarding.find()
            .populate('owner', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentBookings = await Booking.find()
            .populate('user', 'name')
            .populate('hoarding', 'name')
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
                    confirmed: confirmedBookings.length,
                    totalGMV,
                    platformRevenue
                }
            },
            recentUsers,
            recentHoardings,
            recentBookings
        }, { status: 200 });

    } catch (error: any) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
