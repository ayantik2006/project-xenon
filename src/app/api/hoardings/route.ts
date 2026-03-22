import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import Hoarding from '@/models/Hoarding';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import { hoardingSchema } from '@/lib/validators/hoarding';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const view = searchParams.get('view'); // 'vendor' (my listings) or default (public)

    await dbConnect();

    // 1. Vendor View: Fetch only my own listings
    if (view === 'vendor') {
      const cookieStore = await cookies();
      const token = cookieStore.get('accessToken')?.value;

      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify Token
      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      // Get User
      const user = await User.findById(payload.userId);
      if (!user || user.role !== 'vendor') {
        return NextResponse.json({ error: "Access denied. Vendor role required." }, { status: 403 });
      }

      // Return owned hoardings
      const vendorHoardings = await Hoarding.find({ owner: user._id }).sort({ createdAt: -1 });
      return NextResponse.json({ hoardings: vendorHoardings });
    }

    // 2. Public View: Fetch approved listings (with search)
    let query: any = { status: 'approved' }; // Default to showing only approved

    // Check if admin is requesting to show all (Optional future enhancement)
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (token) {
      try {
        const payload = verifyToken(token);
        if (payload) {
          const user = await User.findById(payload.userId);
          if (user && (user.role === 'admin' || user.role === 'vendor')) {
            delete query.status; // Show all to admin or (filtered by owner for vendor - TODO)
          }
        }
      } catch (e) {
        // Ignore token error for public feed
      }
    }

    if (city) {
      query['location.city'] = { $regex: new RegExp(city, 'i') };
    }

    if (type) {
      query.type = type;
    }

    const hoardings = await Hoarding.find(query).sort({ createdAt: -1 }).populate('owner', 'name email image');

    return NextResponse.json({ hoardings });

  } catch (error) {
    console.error("Fetch Hoardings Error:", error);
    return NextResponse.json({ error: "Failed to fetch hoardings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: "Only vendors can list hoardings" }, { status: 403 });
    }

    const body = await req.json();
    const result = hoardingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    const hoarding = await Hoarding.create({
      name: data.name,
      description: data.description,
      location: {
        address: data.address,
        city: data.city,
        area: data.area,
        state: data.state,
        zipCode: data.zipCode,
        coordinates: (data.latitude && data.longitude) ? { lat: data.latitude, lng: data.longitude } : undefined
      },
      dimensions: {
        width: data.width,
        height: data.height
      },
      type: data.type,
      lightingType: data.lightingType,
      pricePerMonth: data.pricePerMonth,
      minimumBookingAmount: data.minimumBookingAmount || 0,
      images: data.images || [],
      owner: user._id,
      status: 'approved' // Auto-publish immediately
    });

    return NextResponse.json({ message: "Hoarding created successfully", hoarding }, { status: 201 });

  } catch (error: any) {
    console.error("Create Hoarding Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
