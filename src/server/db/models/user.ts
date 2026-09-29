import mongoose, { Schema, type Document } from 'mongoose'

export interface IUserDocument extends Document {
  name: string
  email: string
  phone: string | null
  avatar: string | null
  jobTitle: string | null
  timezone: string | null
  isVerified: boolean
  status: 'active' | 'suspended'
  lastLoginAt: Date | null
  onboardedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    // Data URL (base64) today; migrate to cloud storage before scale.
    avatar: { type: String, default: null },
    jobTitle: { type: String, default: null, trim: true },
    // IANA timezone string, e.g. "Asia/Kolkata"
    timezone: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    lastLoginAt: { type: Date, default: null },
    // Null = has not completed the onboarding wizard. Client routes new users
    // to /onboarding until this is set.
    onboardedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export const User =
  (mongoose.models.User as mongoose.Model<IUserDocument>) ??
  mongoose.model<IUserDocument>('User', userSchema)
