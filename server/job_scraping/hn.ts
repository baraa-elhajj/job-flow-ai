import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, child } from 'firebase/database';
import { Job } from '../models/Job.js';
import type { HackerNewsItem } from '../models/Job.js';

// HackerNews provides a public, unauthenticated Firebase interface
const firebaseConfig = {
    databaseURL: 'https://hacker-news.firebaseio.com'
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/**
 * Fetches a single item (story, comment, job, poll, etc.) from the Hacker News API.
 * @param itemId The numeric ID of the item
 * @returns The item data, or null if it doesn't exist/errors out
 */
export async function getHnItem(itemId: number): Promise<HackerNewsItem | null> {
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `v0/item/${itemId}`));

        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log(`No data found for item ${itemId}`);
            return null;
        }
    } catch (error) {
        console.error(`Failed to fetch HN item ${itemId}:`, error);
        throw error;
    }
}

/**
 * Fetches the current largest item ID.
 * You can use this to walk backwards and find recent items.
 */
export async function getMaxItemId(): Promise<number | null> {
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'v0/maxitem'));

        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log("No maxitem available");
            return null;
        }
    } catch (error) {
        console.error("Failed to fetch maxitem:", error);
        throw error;
    }
}

/**
 * Fetches up to 200 of the latest job stories from Hacker News.
 * @returns An array of job item IDs, or null if it fails.
 */
export async function getJobStories(): Promise<number[] | null> {
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'v0/jobstories'));

        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log("No job stories found");
            return null;
        }
    } catch (error) {
        console.error("Failed to fetch job stories:", error);
        throw error;
    }
}

/**
 * Fetches the latest job stories from HackerNews and syncs them to MongoDB.
 * It iterates over the job story IDs and inserts or updates each one.
 */
export async function syncJobStoriesToDB() {
    console.log('Starting sync of latest HackerNews jobs to MongoDB...');
    try {
        const jobIds = await getJobStories();
        if (!jobIds || jobIds.length === 0) {
            console.log('No job stories found from HackerNews.');
            return;
        }

        console.log(`Found ${jobIds.length} job IDs. Fetching details concurrently...`);

        // Fetch items concurrently from Firebase for speed
        const items = await Promise.all(jobIds.map(id => getHnItem(id)));

        // Filter out nulls and items that aren't jobs, then dynamically map the HackerNewsItem to our Job Schema
        const jobsBatch = items
            .filter(item => item && item.type === 'job')
            .map(item => {
                const { id, ...rest } = item!;
                // we rename 'id' to 'hnId' and pass down everything else cleanly!
                return { hnId: id, ...rest };
            });

        if (jobsBatch.length > 0) {
            try {
                // ordered: false ensures that if a Duplicate Key Error (E11000) happens for an existing job, it continues to insert the rest
                await Job.insertMany(jobsBatch, { ordered: false });
                console.log(`Successfully batch inserted ${jobsBatch.length} jobs.`);
            } catch (err: any) {
                // If it's a duplicate key error, we can ignore it since we don't need to update existing ones.
                if (err.code !== 11000 && !err.message?.includes('E11000')) {
                    console.error("Error during batch insert:", err);
                } else {
                    console.log("Batch insert complete (Ignored jobs that were already synced).");
                }
            }
        } else {
            console.log("No valid jobs to insert.");
        }

    } catch (error) {
        console.error('Error syncing jobs to MongoDB:', error);
    }
}


