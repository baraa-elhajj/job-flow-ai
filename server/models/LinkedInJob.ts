import mongoose, { Schema, Document } from "mongoose";

// Base interface for plain job data (used in scraping logic)
export interface LinkedInJobData {
  url: string; // common
  title: string; // common
  companyName?: string; // common
  companyLinkedInUrl?: string;
  location?: string; // common
  datePosted: string; // common
  applicantCount?: string;
  text: string; // common
  benefits?: string;
  source: "linkedin";
}

// Mongoose Document interface
export interface ILinkedInJob extends LinkedInJobData, Document {}

const LinkedInJobSchema: Schema = new Schema(
  {
    url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    companyName: { type: String },
    companyLinkedInUrl: { type: String },
    location: { type: String },
    datePosted: { type: String },
    applicantCount: { type: String },
    text: { type: String },
    benefits: { type: String },
    source: { type: String, default: "linkedin" },
  },
  { timestamps: true },
);

export const LinkedInJob = mongoose.model<ILinkedInJob>(
  "LinkedInJob",
  LinkedInJobSchema,
);
