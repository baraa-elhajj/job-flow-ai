import "dotenv/config";
// import mongoose, { disconnect } from "mongoose";
// import { connectDB } from "../../config/db.js";

// NOTE: This script was written for MongoDB and is no longer active.
// SQLite stores job documents as JSON in the payload column.

/*
async function renameDatabaseFields() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    const db = mongoose.connection.db;
    ...
    const collection = db.collection("Jobs");
    const result = await collection.updateMany(
      { source: "linkedin" },
      { $rename: { ... } },
    );
    ...
  } finally {
    await disconnect();
  }
}

renameDatabaseFields();
*/

console.log(
  "updateLinkedinFields is disabled — MongoDB has been replaced by SQLite.",
);
