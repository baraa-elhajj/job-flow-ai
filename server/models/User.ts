// Mongoose model (commented out — SQLite is now the primary database).
// See server/config/sqlite.ts for the active database layer.

/*
import mongoose, { Schema, type Document } from "mongoose";
*/

export interface IUser {
  id: number;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

/*
const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    picture: { type: String },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);
*/
