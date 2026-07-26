import mongoose, { Schema, Document } from "mongoose";

/**
 * Unified Job interface supporting both HnhiringJobApiResponse and LinkedInJobApiResponse.
 * Common fields are required/prioritized, uncommon fields are optional.
 */
export interface IJob extends Document {
  // Common fields
  title: string;
  text: string;
  datePosted: Date;
  source?: "hnhiring" | "linkedin" | "bayt";
  companyName?: string;
  url?: string | string[];

  // HN Hiring specific fields
  by?: string;
  jobTitle?: string[];
  jobType?: string[];
  employmentType?: string[];
  location?: string | string[];
  skills?: string[];
  seniority?: string[];
  salary?: string[];
  visaSponsorship?: string[];

  // LinkedIn specific fields
  companyLinkedInUrl?: string;
  applicantCount?: string;
  benefits?: string;
}

const JobSchema: Schema = new Schema(
  {
    // Common fields
    title: { type: String, required: true },
    text: { type: String, required: true },
    datePosted: { type: Date, required: true },
    source: { type: String, enum: ["hnhiring", "linkedin", "bayt"] },
    companyName: { type: String },
    url: { type: Schema.Types.Mixed },

    // HN Hiring specific fields
    by: { type: String },
    jobTitle: [{ type: String }],
    jobType: [{ type: String }],
    employmentType: [{ type: String }],
    location: { type: Schema.Types.Mixed },
    skills: [{ type: String }],
    seniority: [{ type: String }],
    salary: [{ type: String }],
    visaSponsorship: [{ type: String }],

    // LinkedIn specific fields
    companyLinkedInUrl: { type: String },
    applicantCount: { type: String },
    benefits: { type: String },
  },
  { timestamps: true },
);

export const Job = mongoose.model<IJob>("Job", JobSchema);
