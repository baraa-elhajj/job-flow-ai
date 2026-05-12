import axios from 'axios';
import * as cheerio from 'cheerio';
import { HNHiringJob } from '../models/HNHiringJob.js';
import type { HNHiringJobData } from '../models/HNHiringJob.js';

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

/**
 * Scrapes job postings from hnhiring.com for the given month and year.
 * @param month - Month name in lowercase (e.g. "april")
 * @param year - Year as a number (e.g. 2026)
 * @returns Array of parsed job objects
 */
export async function scrapeHNHiring(month: string, year: number) {
    const url = `https://hnhiring.com/locations/remote`;
    console.log(`Fetching jobs from ${url}...`);

    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const jobs: HNHiringJobData[] = [];

    const monthYear = `${month.toLowerCase()}-${year}`;

    $('ul.jobs li.job').each((_index, element) => {
        const el = $(element);

        // Extract username
        const by = el.find('div.user a').first().text().trim();

        // Extract date
        const rawDate = el.find('span.type-info').first().text().trim();
        const datePosted = parseDatePosted(rawDate);

        // Extract body
        const bodyEl = el.find('div.body');
        let text = bodyEl.text().trim();

        // Extract title: raw text nodes before the first <p> element
        let title = '';
        bodyEl.contents().each((_i, node) => {
            // Stop when we hit the first <p> element
            if (node.type === 'tag' && (node as any).tagName === 'p') {
                return false; // break out of .each()
            }
            // Collect text from text nodes and inline elements (like <a>)
            if (node.type === 'text') {
                title += (node as any).data;
            } else if (node.type === 'tag') {
                title += $(node).text();
            }
        });
        title = title.trim();

        // Extract all links inside the body
        const links: string[] = [];
        bodyEl.find('a').each((_i, linkEl) => {
            const href = $(linkEl).attr('href');
            if (href) {
                links.push(href);
            }
        });

        text = text.replace(title, "")

        if (by && text) {
            jobs.push({
                by,
                datePosted,
                title,
                text,
                links,
                monthYear,
            });
        }
    });

    console.log(`Parsed ${jobs.length} jobs from ${url}`);
    return jobs;
}

/**
 * Scrapes hnhiring.com for the given month/year and batch inserts into MongoDB.
 * @param month - Month name in lowercase (e.g. "april")
 * @param year - Year as a number (e.g. 2026)
 */
export async function scrapeAndStoreHNHiringJobs(month: string, year: number) {
    console.log(`Starting scrape for ${month} ${year}...`);
    try {
        const jobs = await scrapeHNHiring(month, year);

        if (jobs.length === 0) {
            console.log('No jobs found to store.');
            return;
        }

        await HNHiringJob.insertMany(jobs);
        console.log(`Successfully inserted ${jobs.length} jobs into MongoDB.`);
    } catch (error) {
        console.error('Error scraping/storing HNHiring jobs:', error);
    }
}