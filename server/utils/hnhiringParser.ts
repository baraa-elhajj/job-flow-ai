import * as regexUtils from "./regexUtils.js";
import { GroqCompanyExtractor } from "./LLMHnHiringParserHelpers.js";

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

export class HNHiringParser {

    result: HNParseResult;
    llm: GroqCompanyExtractor;

    constructor() {
        this.result = {};
        this.llm = new GroqCompanyExtractor();
    }

    getLinksFromDesc(description: string): string[] {
        if (!description) return [];
        regexUtils.URL_REGEX.lastIndex = 0;
        const matches = description.match(regexUtils.URL_REGEX);
        if (!matches) return [];
        // Remove duplicates and clean up
        return Array.from(new Set(matches.map(m => m.trim())));
    }

    getMailsFromDesc(description: string): string[] {
        if (!description) return [];
        regexUtils.EMAIL_REGEX.lastIndex = 0;
        const matches = description.match(regexUtils.EMAIL_REGEX);
        if (!matches) return [];
        // Remove duplicates and clean up
        return Array.from(new Set(matches.map(m => m.trim())));
    }

    executeRegexOnString(s: string, isTitle: boolean = false) {
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

        for (const mapping of REGEX_MAPPING) {
            // If we are parsing the description (not the title) and we already found location or jobType in the title, skip them.
            if (!isTitle && (mapping.field === 'location' || mapping.field === 'jobType')) {
                const existingList = this.result[mapping.field];
                if (existingList && existingList.length > 0) {
                    continue;
                }
            }

            mapping.regex.lastIndex = 0;
            const matches = s.match(mapping.regex);
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
                    for (const matchStr of cleanedMatches) {
                        // Only add if not entirely duplicated
                        if (!targetArray.includes(matchStr)) {
                            targetArray.push(matchStr);
                        }
                    }
                }

                if (mapping.removeMatch) {
                    s = s.replace(mapping.regex, "");
                }
            }
        }
    }

    async parseHnJob(title: string, description: string) {
        const links = this.getLinksFromDesc(description);
        const mail = this.getMailsFromDesc(description);

        // Reset result on each call so the class instance can be re-used safely
        this.result = {};
        let titleParts = title.split("|").map(p => p.trim()).filter(Boolean) as string[];
        if (titleParts.length === 1) {
            titleParts = title.split("\\").map(p => p.trim()).filter(Boolean) as string[];
        }

        if (titleParts.length != 0) {

            const cpname = await this.llm.extractCompanyName(titleParts[0]!, links, mail);

            if (cpname != null) {
                this.result.companyName = cpname;
            }
        }


        for (let i = 0; i < titleParts.length; i++) {
            let p = titleParts[i]!;
            this.executeRegexOnString(p, true);
        }

        this.executeRegexOnString(description, false);

        return this.result;
    }
}

// TODO: Remove later when parsing is working 100% as expected.

// console.log(new HNHiringParser().parseHnTitle("OneChronos | Systems Engineers + Software Engineer, Data Platform | NYC (HQ), London or Amsterdam | Flexible / Remote | Full-Time | Remote"));
// console.log(new HNHiringParser().parseHnTitle("Eequ | Senior Backend Engineer | Remote (UK) | Full-time | £80k–£110k | Node.js, NestJS, TypeScript, MySQL, AWS, Terraform"));
// console.log(new HNHiringParser().parseHnTitle("Greenhouse Software | Engineering Manager (Analytics Product) | REMOTE (Ontario or BC, Canada) | Full-time | We're unable to support sponsorship at this time."));
// console.log(new HNHiringParser().parseHnTitle("Lucia Protocol Remote | Full time | https://www.luciaprotocol.com/"));
// console.log(new HNHiringParser().parseHnTitle("remoter | Platform Engineer (Security), DevSecOps Engineer & Full-stack Product Engineer| Hybrid | NYC"));
// console.log(new HNHiringParser().parseHnTitle("Apple | SRE | San Diego | Full-time"));