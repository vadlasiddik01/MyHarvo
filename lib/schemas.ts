import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    usernameHi: { type: String },
    usernameTe: { type: String },
    passwordHash: { type: String, required: true },
    pinHash: { type: String, required: true },
  },
  { timestamps: true }
);

const harvestingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    village: { type: String, required: true },
    villageHi: { type: String },
    villageTe: { type: String },
    farmerName: { type: String, required: true },
    farmerNameHi: { type: String },
    farmerNameTe: { type: String },
    date: { type: Date, required: true },
    hoursWorked: { type: Number, required: true }, // in decimal (e.g., 2.5 = 2 hours 30 mins)
    startTime: { type: String }, // HH:MM format
    endTime: { type: String }, // HH:MM format
    notes: { type: String },
  },
  { timestamps: true }
);

const dieselSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    village: { type: String, required: true },
    villageHi: { type: String },
    villageTe: { type: String },
    date: { type: Date, required: true },
    litres: { type: Number, required: true },
    costPerLitre: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

const serviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    descriptionHi: { type: String },
    descriptionTe: { type: String },
    cost: { type: Number, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User || mongoose.model('User', userSchema);
export const Harvesting =
  mongoose.models.Harvesting || mongoose.model('Harvesting', harvestingSchema);
export const Diesel =
  mongoose.models.Diesel || mongoose.model('Diesel', dieselSchema);
export const Service =
  mongoose.models.Service || mongoose.model('Service', serviceSchema);
