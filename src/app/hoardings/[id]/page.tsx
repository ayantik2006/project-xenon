import { notFound } from "next/navigation";
import dbConnect from "@/lib/dbConnect";
import Hoarding from "@/models/Hoarding";
import HoardingDetailClient from "./HoardingDetailClient";
import {
  getPlatformPricingSettings,
  withBuyerFacingPricing,
} from "@/lib/platformPricing";

interface HoardingPageProps {
  params: Promise<{ id: string }>;
}

export default async function HoardingPage({ params }: HoardingPageProps) {
  const { id } = await params;

  await dbConnect();

  let hoarding;
  try {
    hoarding = await Hoarding.findById(id).lean();
  } catch (error) {
    console.error("Error fetching hoarding:", error);
    return notFound();
  }

  if (!hoarding) {
    return notFound();
  }

  // Convert MongoDB ObjectId and Date objects to strings for the Client Component
  const pricingSettings = await getPlatformPricingSettings();
  const serializedHoarding = withBuyerFacingPricing(
    JSON.parse(JSON.stringify(hoarding)),
    pricingSettings,
  );

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <HoardingDetailClient hoarding={serializedHoarding} />
    </main>
  );
}
