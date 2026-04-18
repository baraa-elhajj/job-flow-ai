import * as regexUtils from "./regex_utils.js";
import { connectDB } from "../../config/db.js";
import { match } from "node:assert";

// connectDB();

type HNParseResult = {
    companyName?: string;
    jobTitle?: string[];
    jobType?: string[];
    employmentType?: string[];
    location?: string[];
    skills?: string[];
    seniority?: string[];
    salary?: string[];
    visaSponsorship?: string[];
    url?: string[];
}

class HNHiringParser {

    result: HNParseResult;

    constructor() {
        this.result = {};
    }

    parseHnTitle(title: string) {
        // Reset result on each call so the class instance can be re-used safely
        this.result = {};
        let titleParts = title.split("|").map(p => p.trim()).filter(Boolean) as string[];
        if (titleParts.length === 1) {
            titleParts = title.split("\\").map(p => p.trim()).filter(Boolean) as string[];
        }
        const REGEX_MAPPING: { regex: RegExp; field: keyof HNParseResult; removeMatch?: boolean }[] = [
            { regex: regexUtils.URL_REGEX, field: 'url', removeMatch: true },
            { regex: regexUtils.VISA_SPONSORSHIP_REGEX, field: 'visaSponsorship', removeMatch: true },
            { regex: regexUtils.SALARY_REGEX, field: 'salary', removeMatch: true },
            { regex: regexUtils.EMPLOYMENT_TYPE_REGEX, field: 'employmentType', removeMatch: true },
            { regex: regexUtils.WORK_TYPE_REGEX, field: 'jobType', removeMatch: true },
            { regex: regexUtils.COUNTRY_REGEX, field: 'location', removeMatch: true },
            { regex: regexUtils.US_CITY_REGEX, field: 'location', removeMatch: true },
            { regex: regexUtils.TECH_SKILLS_REGEX, field: 'skills' },
            { regex: regexUtils.SENIORITY_REGEX, field: 'seniority' },
            { regex: regexUtils.JOB_ROLE_REGEX, field: 'jobTitle' }
        ];
        if (titleParts.length > 0) {
            const p0 = titleParts[0]!;
            let minIndex = p0.length;

            for (const mapping of REGEX_MAPPING) {
                mapping.regex.lastIndex = 0;
                const match = mapping.regex.exec(p0);
                if (match && match.index < minIndex) {
                    minIndex = match.index;
                }
            }

            const companyStr = p0.substring(0, minIndex).replace(/^[,\-\+\s|]+|[,\-\+\s|]+$/g, '').trim();
            if (companyStr) {
                this.result.companyName = companyStr;
            }

            // Slice out the company name so only the matching remainder gets scanned in the loop
            titleParts[0] = p0.substring(minIndex);
        }

        const titleFallbackCandidates: string[] = [];

        for (let i = 0; i < titleParts.length; i++) {
            let p = titleParts[i]!;

            // Match and extract each regex mapped globally
            for (const mapping of REGEX_MAPPING) {
                mapping.regex.lastIndex = 0;
                const matches = p.match(mapping.regex);
                if (matches) {
                    const cleanedMatches = matches
                        .map(m => m.trim().replace(/^[,\s]+|[,\s]+$/g, ''))
                        .filter(Boolean);

                    if (cleanedMatches.length > 0) {
                        if (!this.result[mapping.field]) {
                            // TypeScript doesn't dynamically know we're addressing array fields here
                            (this.result[mapping.field] as string[]) = [];
                        }

                        const targetArray = this.result[mapping.field] as string[];

                        if (mapping.field === 'jobTitle') {
                            // If it's a job title, keep the full remaining context of this section, not just the isolated match
                            const fullSection = p.replace(/^[,\-\+\s|]+|[,\-\+\s|]+$/g, '').trim();
                            if (fullSection && !targetArray.includes(fullSection)) {
                                targetArray.push(fullSection);
                            }
                        } else {
                            if (mapping.field === 'seniority') {
                                const fullSection = p.replace(/^[,\-\+\s|]+|[,\-\+\s|]+$/g, '').trim();
                                if (fullSection && !titleFallbackCandidates.includes(fullSection)) {
                                    titleFallbackCandidates.push(fullSection);
                                }
                            }

                            for (const matchStr of cleanedMatches) {
                                // Only add if not entirely duplicated
                                if (!targetArray.includes(matchStr)) {
                                    targetArray.push(matchStr);
                                }
                            }
                        }
                    }

                    if (mapping.removeMatch) {
                        p = p.replace(mapping.regex, "");
                    }
                }
            }
        }

        if (!this.result.jobTitle || this.result.jobTitle.length == 0) {
            this.result.jobTitle = titleFallbackCandidates.length > 0 ? titleFallbackCandidates : [``];
        }
        return this.result;
    }
}

console.log(new HNHiringParser().parseHnTitle("OneChronos | Systems Engineers + Software Engineer, Data Platform | NYC (HQ), London or Amsterdam | Flexible / Remote | Full-Time | Remote"));
console.log(new HNHiringParser().parseHnTitle("Eequ | Senior Backend Engineer | Remote (UK) | Full-time | £80k–£110k | Node.js, NestJS, TypeScript, MySQL, AWS, Terraform"));
console.log(new HNHiringParser().parseHnTitle("Greenhouse Software | Engineering Manager (Analytics Product) | REMOTE (Ontario or BC, Canada) | Full-time | We're unable to support sponsorship at this time."));
console.log(new HNHiringParser().parseHnTitle("Lucia Protocol Remote | Full time | https://www.luciaprotocol.com/"));
console.log(new HNHiringParser().parseHnTitle("remoter | Platform Engineer (Security), DevSecOps Engineer & Full-stack Product Engineer| Hybrid | NYC"));
console.log(new HNHiringParser().parseHnTitle("Apple | SRE | San Diego | Full-time"));