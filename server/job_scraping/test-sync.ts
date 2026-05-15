import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from '../config/db.js';
import { syncJobStoriesToDB } from './hn.js';

async function runTest() {
    try {
        console.log("Connecting to database...");
        await connectDB();

        console.log("Running syncJobStoriesToDB()...");
        await syncJobStoriesToDB();

        console.log("Test complete. Disconnecting from database...");
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

runTest();
