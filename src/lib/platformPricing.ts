import PlatformSettings from "@/models/PlatformSettings";

export type PlatformPricingSettings = {
  hoardspaceCommissionPercent: number;
  razorpayPercent: number;
  gstPercent: number;
};

export const DEFAULT_PLATFORM_PRICING: PlatformPricingSettings = {
  hoardspaceCommissionPercent: 0,
  razorpayPercent: 2.5,
  gstPercent: 2.5,
};

export async function getPlatformPricingSettings(): Promise<PlatformPricingSettings> {
  const settings = await PlatformSettings.findOne({ key: "default" }).lean();

  return {
    hoardspaceCommissionPercent:
      Number(settings?.hoardspaceCommissionPercent) ||
      DEFAULT_PLATFORM_PRICING.hoardspaceCommissionPercent,
    razorpayPercent:
      Number(settings?.razorpayPercent) ||
      DEFAULT_PLATFORM_PRICING.razorpayPercent,
    gstPercent:
      Number(settings?.gstPercent) || DEFAULT_PLATFORM_PRICING.gstPercent,
  };
}

export function calculateBuyerMonthlyPrice(
  basePricePerMonth: number,
  settings: PlatformPricingSettings,
) {
  const base = Number(basePricePerMonth) || 0;
  const hoardspaceCommission =
    (base * settings.hoardspaceCommissionPercent) / 100;
  const razorpayCharges = (base * settings.razorpayPercent) / 100;
  const gst = (base * settings.gstPercent) / 100;
  const total = Math.ceil(
    base + hoardspaceCommission + razorpayCharges + gst,
  );

  return {
    basePricePerMonth: base,
    hoardspaceCommission: Math.ceil(hoardspaceCommission),
    razorpayCharges: Math.ceil(razorpayCharges),
    gst: Math.ceil(gst),
    totalPricePerMonth: total,
  };
}

export function calculateCampaignPricing(
  basePricePerMonth: number,
  diffDays: number,
  settings: PlatformPricingSettings,
) {
  const vendorBaseAmount = Math.ceil(((Number(basePricePerMonth) || 0) / 30) * diffDays);
  const hoardspaceCommission =
    (vendorBaseAmount * settings.hoardspaceCommissionPercent) / 100;
  const gatewayCharges =
    (vendorBaseAmount * settings.razorpayPercent) / 100;
  const gst = (vendorBaseAmount * settings.gstPercent) / 100;
  const totalAmount = Math.ceil(
    vendorBaseAmount + hoardspaceCommission + gatewayCharges + gst,
  );

  return {
    vendorBaseAmount,
    hoardspaceCommission: Math.ceil(hoardspaceCommission),
    gatewayCharges: Math.ceil(gatewayCharges),
    gst: Math.ceil(gst),
    totalAmount,
    platformFee: Math.ceil(hoardspaceCommission + gatewayCharges + gst),
  };
}

export function withBuyerFacingPricing<T extends { pricePerMonth: number }>(
  hoarding: T,
  settings: PlatformPricingSettings,
) {
  const pricing = calculateBuyerMonthlyPrice(hoarding.pricePerMonth, settings);

  return {
    ...hoarding,
    basePricePerMonth: pricing.basePricePerMonth,
    vendorPricePerMonth: pricing.basePricePerMonth,
    pricePerMonth: pricing.totalPricePerMonth,
    pricingConfig: settings,
    pricingBreakdown: pricing,
  };
}
