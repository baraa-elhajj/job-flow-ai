import mongoose, { Schema, Document } from 'mongoose';
export interface HackerNewsItem {
    id: number;
    deleted?: boolean;
    type: "job" | "story" | "comment" | "poll" | "pollopt";
    by?: string;
    time?: number;
    text?: string;
    dead?: boolean;
    parent?: number;
    poll?: number;
    kids?: number[];
    url?: string;
    score?: number;
    title?: string;
    parts?: number[];
    descendants?: number;
}

// We omit 'id' from HackerNewsItem because Mongoose has its own '_id'/'id'.
// We remap it to 'hnId'.
export interface IJob extends Omit<HackerNewsItem, 'id'>, Document {
    hnId: number;
}

const JobSchema: Schema = new Schema({
    hnId: { type: Number, required: true, unique: true },
    deleted: { type: Boolean },
    type: { type: String, default: 'job' },
    by: { type: String },
    time: { type: Number },
    text: { type: String },
    dead: { type: Boolean },
    parent: { type: Number },
    poll: { type: Number },
    kids: [{ type: Number }],
    url: { type: String },
    score: { type: Number },
    title: { type: String },
    parts: [{ type: Number }],
    descendants: { type: Number }
}, { timestamps: true });

export const Job = mongoose.model<IJob>('Job', JobSchema);
