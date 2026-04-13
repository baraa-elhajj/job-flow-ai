import axios from 'axios';
import * as cheerio from 'cheerio';
import { HNHiringJob } from '../models/HNHiringJob.js';
import type { HNHiringJobData } from '../models/HNHiringJob.js';

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

    const jobs: HNHiringJobData[] = [];

    const monthYear = `${month.toLowerCase()}-${year}`;

    $('ul.jobs li.job').each((_index, element) => {
        const el = $(element);

        // Extract username
        const by = el.find('div.user a').first().text().trim();

        // Extract date
        const datePosted = el.find('span.type-info').first().text().trim();

        // Extract body
        const bodyEl = el.find('div.body');
        const text = bodyEl.text().trim();

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
