import mongoose, { Schema, Document } from 'mongoose';

// Base interface for plain job data (used in scraping logic)
export interface HNHiringJobData {
    by: string;
    datePosted: string;
    title: string;
    text: string;
    links: string[];
    monthYear: string;
}

// Mongoose Document interface
export interface IHNHiringJob extends HNHiringJobData, Document {}

const HNHiringJobSchema: Schema = new Schema({
    by: { type: String, required: true },
    datePosted: { type: String },
    title: { type: String },
    text: { type: String },
    links: [{ type: String }],
    monthYear: { type: String, required: true },
}, { timestamps: true });

export const HNHiringJob = mongoose.model<IHNHiringJob>('HNHiringJob', HNHiringJobSchema);
