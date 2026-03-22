import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHoarding extends Document {
  name: string;
  description?: string;
  location: {
    address: string;
    city: string;
    area: string; // New area field
    state: string;
    zipCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  dimensions: {
    width: number;
    height: number;
  };
  type: string;
  lightingType: 'Lit' | 'Non-Lit' | 'Front Lit' | 'Back Lit'; // New lighting type
  pricePerMonth: number;
  minimumBookingAmount: number;
  images: string[];
  owner: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  uniqueReach?: number; // Admin field for daily traffic/reach
  availability: {
      blockedDates: Array<{ startDate: Date; endDate: Date; reason?: string }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const HoardingSchema: Schema<IHoarding> = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    area: { type: String, required: true }, // Added area
    state: { type: String, required: true },
    zipCode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  dimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  type: { 
    type: String, 
    required: true,
    enum: ["Billboard", "Unipole", "Gantry", "Bus Shelter", "Kiosk", "Other"]
  },
  lightingType: {
    type: String,
    required: true,
    enum: ['Lit', 'Non-Lit', 'Front Lit', 'Back Lit'],
    default: 'Non-Lit'
  },
  pricePerMonth: { type: Number, required: true },
  minimumBookingAmount: { type: Number, default: 0 },
  images: [{ type: String }],
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {  
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-publish immediately as per requirement
  },
  uniqueReach: { type: Number }, // Manually fed by admin
  availability: {
     blockedDates: [{
         startDate: { type: Date },
         endDate: { type: Date },
         reason: { type: String }
     }]
  }
}, {
  timestamps: true
});

// Create index for location-based text search if needed later
HoardingSchema.index({ 'location.city': 'text', 'location.address': 'text', name: 'text' });

// Prevent Mongoose model recompilation in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Hoarding;
}

const Hoarding = mongoose.models.Hoarding || mongoose.model<IHoarding>('Hoarding', HoardingSchema);

export default Hoarding;
