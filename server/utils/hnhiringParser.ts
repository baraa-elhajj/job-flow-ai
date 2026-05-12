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
    llm: GroqCompanyExtractor;

    constructor() {
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

    executeRegexOnString(s: string, result: HNParseResult, isTitle: boolean = false) {
        const REGEX_MAPPING: { regex: RegExp; field: keyof HNParseResult; removeMatch?: boolean }[] = [
            { regex: regexUtils.URL_REGEX, field: 'url', removeMatch: true },
            { regex: regexUtils.VISA_SPONSORSHIP_REGEX, field: 'visaSponsorship', removeMatch: true },
            // { regex: regexUtils.SALARY_REGEX, field: 'salary', removeMatch: true },
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
                const existingList = result[mapping.field];
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
                    if (!result[mapping.field]) {
                        // TypeScript doesn't dynamically know we're addressing array fields here
                        (result[mapping.field] as string[]) = [];
                    }

                    const targetArray = result[mapping.field] as string[];
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

    hasAnyRegexMatch(s: string): boolean {
        const regexes = [
            regexUtils.URL_REGEX,
            regexUtils.VISA_SPONSORSHIP_REGEX,
            // regexUtils.SALARY_REGEX,
            regexUtils.EMPLOYMENT_TYPE_REGEX,
            regexUtils.WORK_TYPE_REGEX,
            regexUtils.COUNTRY_REGEX,
            regexUtils.US_CITY_REGEX,
            regexUtils.TECH_SKILLS_REGEX,
            regexUtils.SENIORITY_REGEX,
            regexUtils.JOB_ROLE_REGEX
        ];

        for (const regex of regexes) {
            regex.lastIndex = 0;
            if (regex.test(s)) {
                return true;
            }
        }

        return false;
    }


    async parseHnJob(title: string, description: string) {
        const links = this.getLinksFromDesc(description);
        const mail = this.getMailsFromDesc(description);

        const result: HNParseResult = {};
        let titleParts = title.split("|").map(p => p.trim()).filter(Boolean) as string[];
        if (titleParts.length === 1) {
            titleParts = title.split("\\").map(p => p.trim()).filter(Boolean) as string[];
        }

        if (titleParts.length != 0) {
            const firstPart = titleParts[0]!;

            if (!this.hasAnyRegexMatch(firstPart))
                result.companyName = firstPart;

            else {
                const cpname = await this.llm.extractCompanyName(firstPart, links, mail);

                if (cpname != null) {
                    result.companyName = cpname;
                }
            }
        }


        for (let i = 0; i < titleParts.length; i++) {
            let p = titleParts[i]!;
            this.executeRegexOnString(p, result, true);
        }

        this.executeRegexOnString(description, result, false);


        for (const field in result) {
            const key = field as keyof HNParseResult;
            const list = result[key];

            if (Array.isArray(list)) {
                const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9+#]/g, '');

                (result[key] as string[]) = list.filter((currentStr: string, i: number) => {
                    const normCurrent = normalize(currentStr);
                    return !list.some((otherStr: string, j: number) => {
                        return i !== j && normalize(otherStr).includes(normCurrent);
                    });
                });
            }
        }

        return result;
    }
}

// TODO: Remove later when parsing is working 100% as expected.

// console.log(new HNHiringParser().parseHnTitle("OneChronos | Systems Engineers + Software Engineer, Data Platform | NYC (HQ), London or Amsterdam | Flexible / Remote | Full-Time | Remote"));
// console.log(new HNHiringParser().parseHnTitle("Eequ | Senior Backend Engineer | Remote (UK) | Full-time | £80k–£110k | Node.js, NestJS, TypeScript, MySQL, AWS, Terraform"));
// console.log(new HNHiringParser().parseHnTitle("Greenhouse Software | Engineering Manager (Analytics Product) | REMOTE (Ontario or BC, Canada) | Full-time | We're unable to support sponsorship at this time."));
// console.log(new HNHiringParser().parseHnTitle("Lucia Protocol Remote | Full time | https://www.luciaprotocol.com/"));
// console.log(new HNHiringParser().parseHnTitle("remoter | Platform Engineer (Security), DevSecOps Engineer & Full-stack Product Engineer| Hybrid | NYC"));
// console.log(new HNHiringParser().parseHnTitle("Apple | SRE | San Diego | Full-time"));