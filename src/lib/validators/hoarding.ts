import { z } from "zod";

export const hoardingSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),

  // Location Details
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  area: z.string().min(2, "Area is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().optional(),
  latitude: z.number().finite("Pin the listing on the map"),
  longitude: z.number().finite("Pin the listing on the map"),

  // Physical Specs
  width: z.number().min(1, "Width is required"),
  height: z.number().min(1, "Height is required"),
  type: z.enum(["Billboard", "Unipole", "Gantry", "Bus Shelter", "Kiosk", "Other"]),
  lightingType: z.enum(["Lit", "Non-Lit", "Front Lit", "Back Lit"]),

  // Commercials
  pricePerMonth: z.number().min(1, "Price per month is required"),
  minimumBookingAmount: z.number().min(0).default(0),
  minimumBookingMonths: z.number().min(1).default(1),
  hoardingCode: z.string().optional(),
  trafficFrom: z.string().optional(),
  uniqueReach: z.number().min(0).default(0),
  uniqueFootfall: z.number().min(0).default(0),

  // Media
  images: z.array(z.string().url()).optional(),
});

export type HoardingInput = z.infer<typeof hoardingSchema>;
export type HoardingOutput = z.output<typeof hoardingSchema>;
