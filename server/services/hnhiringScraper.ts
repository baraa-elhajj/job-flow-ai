import axios from 'axios';
import * as cheerio from 'cheerio';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { HNHiringJob } from '../models/HNHiringJob.js';
import type { HNHiringJobData } from '../models/HNHiringJob.js';

const CHECKPOINT_FILE = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'data',
    'hnhiring_first_title.txt',
);

async function readCheckpointTitle(): Promise<string | null> {
    try {
        const raw = await readFile(CHECKPOINT_FILE, 'utf8');
        const t = raw.trim();
        return t.length ? t : null;
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        throw err;
    }
}

async function writeCheckpointTitle(title: string): Promise<void> {
    await mkdir(path.dirname(CHECKPOINT_FILE), { recursive: true });
    await writeFile(CHECKPOINT_FILE, `${title}\n`, 'utf8');
}

function parseDatePosted(raw: string): string {
    const dateMatch = raw.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (dateMatch) {
        return dateMatch[0];
    }

    const relativeMatch = raw.match(/about\s+(\d+)\s+(minute|hour|day|month)s?\s+ago/i);
    if (relativeMatch) {
        const value = parseInt(relativeMatch[1]!, 10);
        const unit = relativeMatch[2]!.toLowerCase();
        const date = new Date();

        if (unit === 'minute') {
            date.setMinutes(date.getMinutes() - value);
        } else if (unit === 'hour') {
            date.setHours(date.getHours() - value);
        } else if (unit === 'day') {
            date.setDate(date.getDate() - value);
        } else if (unit === 'month') {
            date.setMonth(date.getMonth() - value);
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return raw.replace(/^Posted\s+/i, '').trim();
}

function parseJobFromElement(
    $: cheerio.CheerioAPI,
    element: Parameters<typeof $>[0],
    monthYear: string,
): HNHiringJobData | null {
    const el = $(element);

    const by = el.find('div.user a').first().text().trim();

    const rawDate = el.find('span.type-info').first().text().trim();
    const datePosted = parseDatePosted(rawDate);

    const bodyEl = el.find('div.body');

    let title = '';
    const nodesToRemove: Parameters<typeof $>[0][] = [];
    bodyEl.contents().each((_i, node) => {
        if (node.type === 'tag' && (node as { tagName?: string }).tagName === 'p') {
            return false;
        }
        if (node.type === 'text') {
            title += (node as { data?: string }).data ?? '';
        } else if (node.type === 'tag') {
            title += $(node).text();
        }
        nodesToRemove.push(node);
    });
    title = title.trim();

    nodesToRemove.forEach(node => $(node).remove());

    const text = bodyEl.html()?.trim() || '';

    const links: string[] = [];
    bodyEl.find('a').each((_i, linkEl) => {
        const href = $(linkEl).attr('href');
        if (href) {
            links.push(href);
        }
    });

    if (!by || !text) {
        return null;
    }

    return {
        by,
        datePosted,
        title,
        text,
        links,
        monthYear,
        source: 'hnhiring' as const,
    };
}

/**
 * Walks job list in page order. Sets {@link firstTitleOnPage} from the first valid job.
 * If {@link stopWhenTitleEquals} is set, stops before adding a job whose title matches
 * (that job and everything after it are omitted).
 */
function parseHNHiringJobsFromDocument(
    $: cheerio.CheerioAPI,
    monthYear: string,
    stopWhenTitleEquals: string | null,
): { jobs: HNHiringJobData[]; firstTitleOnPage: string | null } {
    const jobs: HNHiringJobData[] = [];
    let firstTitleOnPage: string | null = null;

    const items = $('ul.jobs li.job').toArray();
    for (const element of items) {
        const job = parseJobFromElement($, element, monthYear);
        if (!job) {
            continue;
        }

        if (firstTitleOnPage === null) {
            firstTitleOnPage = job.title;
        }

        if (stopWhenTitleEquals && job.title === stopWhenTitleEquals) {
            break;
        }

        jobs.push(job);
    }

    return { jobs, firstTitleOnPage };
}

/**
 * Scrapes job postings from hnhiring.com for the given month and year.
 * @param month - Month name in lowercase (e.g. "april")
 * @param year - Year as a number (e.g. 2026)
 * @returns Array of parsed job objects
 */
export async function scrapeHNHiring(month: string, year: number) {
    const url = `https://hnhiring.com/${month.toLowerCase()}-${year}`;

    console.log(`Fetching jobs from ${url}...`);

    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const monthYear = `${month.toLowerCase()}-${year}`;
    const { jobs } = parseHNHiringJobsFromDocument($, monthYear, null);

    console.log(`Parsed ${jobs.length} jobs from ${url}`);
    return jobs;
}

/**
 * Scrapes hnhiring.com for the given month/year and batch inserts into MongoDB.
 * Uses {@link server/data/hnhiring_first_title.txt} to remember the first valid job title
 * from the last run: scraping stops when that title is seen again (so only newer listings
 * are inserted), then the file is updated to the current first job title on the page.
 * @param month - Month name in lowercase (e.g. "april")
 * @param year - Year as a number (e.g. 2026)
 */
export async function scrapeAndStoreHNHiringJobs(month: string, year: number) {
    console.log(`Starting scrape for ${month} ${year}...`);
    const url = `https://hnhiring.com/${month.toLowerCase()}-${year}`;

    try {
        const checkpoint = await readCheckpointTitle();
        if (checkpoint) {
            console.log(`Incremental mode: will stop at first job titled: ${checkpoint.slice(0, 80)}${checkpoint.length > 80 ? '…' : ''}`);
        }

        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);
        const monthYear = `${month.toLowerCase()}-${year}`;
        const { jobs, firstTitleOnPage } = parseHNHiringJobsFromDocument($, monthYear, checkpoint);

        console.log(`Parsed ${jobs.length} new job(s) (checkpoint ${checkpoint ? 'active' : 'none'}).`);

        if (jobs.length > 0) {
            await HNHiringJob.insertMany(jobs);
            console.log(`Successfully inserted ${jobs.length} jobs into MongoDB.`);
        } else {
            console.log('No new jobs found to store.');
        }

        if (firstTitleOnPage) {
            await writeCheckpointTitle(firstTitleOnPage);
            console.log('Updated HN hiring scrape checkpoint (first title on page).');
        }

        return jobs;
    } catch (error) {
        console.error('Error scraping/storing HNHiring jobs:', error);
        throw error;
    }
}
