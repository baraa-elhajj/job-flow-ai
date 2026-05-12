import axios from "axios";

/**
 * Uses Groq (free tier, Llama 3.3 70B) to extract the company name
 * from the first pipe-separated section of an HN Hiring title.
 *
 * Only the first segment is sent — keeping token usage tiny (~50 tokens/req).
 * Free tier: 30 RPM, 14.4K tokens/min.
 */
export class GroqCompanyExtractor {
    private apiKey: string;
    private model: string;
    private apiUrl: string;

    constructor(apiKey?: string, model: string = "llama-3.3-70b-versatile") {
        this.apiKey = apiKey || process.env.GROQ_API_KEY || "";
        this.model = model;
        this.apiUrl = "https://api.groq.com/openai/v1/chat/completions";

        if (!this.apiKey) {
            console.warn("GroqCompanyExtractor: No API key found. Set GROQ_API_KEY in .env");
        }
    }

    /**
     * Extracts the company name from the first pipe-separated section of an
     * HN Hiring title. Returns the company name string, or null if extraction fails.
     */
    async extractCompanyName(title: string, links: string[], emails: string[]): Promise<string | null> {
        // Get the first pipe-separated segment
        let firstSection = title.split("|")[0]?.trim();
        if (!firstSection) {
            // Try backslash as fallback delimiter
            firstSection = title.split("\\")[0]?.trim();
        }
        if (!firstSection) return null;

        try {
            const response = await axios.post(
                this.apiUrl,
                {
                    model: this.model,
                    messages: [
                        {
                            role: "system",
                            content: "You extract company names from job postings. Return ONLY the company name as plain text. No quotes, no explanation. If no company name is found, return None.",
                        },
                        {
                            role: "user",
                            content: `Extract the company name based on the info provided. The primary source for the company name is the Title segment. The provided Links and Emails are just to help you gain more confidence in identifying the correct name.
WARNING: Do NOT return the names of Applicant Tracking Systems (ATS) or job boards that might appear in URLs (e.g., Dover, Ashby, Greenhouse, Lever, Workable, Y Combinator, etc.).
Remove any job titles, locations, work types (remote/onsite/hybrid), employment types (full-time/part-time/contract), or other metadata. If there are no links and emails, guess the company name from the title only. If you cannot find any result, return None.
The company name is in the title segment links just to help infering, 

Title segment: "${firstSection}"
Links: ${links.length > 0 ? links.join(', ') : 'None'}
Emails: ${emails.length > 0 ? emails.join(', ') : 'None'}`,
                        },
                    ],
                    temperature: 0,
                    max_tokens: 50,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );

            const text = response.data?.choices?.[0]?.message?.content?.trim();

            if (!text || text === "None") return null;

            return text;
        } catch (error: any) {
            console.error("GroqCompanyExtractor error:", error?.response?.data || error.message);
            return null;
        }
    }
}