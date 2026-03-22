import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  hoarding: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentId?: string;
  orderId: string;
  createdAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema({
  hoarding: { type: Schema.Types.ObjectId, ref: 'Hoarding', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  paymentId: { type: String },
  orderId: { type: String, required: true },
}, { timestamps: true });

const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
export default Booking;
