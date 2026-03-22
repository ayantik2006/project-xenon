import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

// GET all users (admin only)
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

        // Get all users with filters
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const kycStatus = searchParams.get('kycStatus');

        let query: any = {};
        if (role) query.role = role;
        if (kycStatus) query.kycStatus = kycStatus;

        const users = await User.find(query)
            .select('-password -refreshToken')
            .sort({ createdAt: -1 });

        return NextResponse.json({ users }, { status: 200 });

    } catch (error: any) {
        console.error("Admin Users Fetch Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
