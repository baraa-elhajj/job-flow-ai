import mongoose, { Schema, Document } from "mongoose";

// Base interface for plain job data (used in scraping logic)
export interface LinkedInJobDataRaw {
  url: string;
  title: string;
  company?: string;
  location?: string;
  jobDescription?: string;
}

// Mongoose Document interface
export interface ILinkedInJob extends LinkedInJobDataRaw, Document {}

const LinkedInJobSchema: Schema = new Schema(
  {
    url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    company: { type: String },
    location: { type: String },
    jobDescription: { type: String },
  },
  { timestamps: true },
);

export const LinkedInJob = mongoose.model<ILinkedInJob>(
  "LinkedInJob",
  LinkedInJobSchema,
);
