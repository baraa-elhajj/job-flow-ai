import { Meilisearch } from "meilisearch";

const INDEX_NAME = "jobs";
const MAX_TEXT_LENGTH = 8000;

let client: Meilisearch | null = null;
let enabled = false;
let initialization: Promise<boolean> | null = null;
let lastConnectionAttempt = 0;

const RECONNECT_DELAY_MS = 5_000;

export interface JobSearchDocument {
  id: string;
  source: string;
  title?: string;
  companyName?: string;
  location?: string;
  text?: string;
  skills?: string[];
  datePosted?: string;
  datePostedTimestamp?: number;
}

function getConfig(): { host: string; apiKey: string } | null {
  const host = process.env.MEILI_HOST?.trim();
  const apiKey = process.env.MEILI_API_KEY?.trim();
  if (!host || !apiKey) {
    return null;
  }
  return { host, apiKey };
}

export function isMeilisearchEnabled(): boolean {
  return enabled;
}

function normalizeLocation(job: Record<string, unknown>): string | undefined {
  const location = job.location;
  if (typeof location === "string" && location.trim()) {
    return location.trim();
  }
  if (Array.isArray(location)) {
    const parts = location
      .filter((value): value is string => typeof value === "string" && value.trim() !== "")
      .map((value) => value.trim());
    if (parts.length > 0) {
      return parts.join(", ");
    }
  }
  return undefined;
}

function normalizeSkills(job: Record<string, unknown>): string[] | undefined {
  const skills = job.skills;
  if (!Array.isArray(skills)) {
    return undefined;
  }
  const normalized = skills
    .filter((value): value is string => typeof value === "string" && value.trim() !== "")
    .map((value) => value.trim());
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeDatePosted(job: Record<string, unknown>): string | undefined {
  const datePosted = job.datePosted ?? job.date_posted;
  if (datePosted instanceof Date) {
    return datePosted.toISOString();
  }
  if (typeof datePosted === "number") {
    return new Date(datePosted).toISOString();
  }
  if (typeof datePosted === "string" && datePosted.trim()) {
    return datePosted.trim();
  }
  return undefined;
}

export function jobToSearchDocument(
  sqliteId: string,
  job: Record<string, unknown>,
): JobSearchDocument {
  const source =
    typeof job.source === "string" && job.source.trim()
      ? job.source.trim()
      : "unknown";
  const title =
    typeof job.title === "string" && job.title.trim()
      ? job.title.trim()
      : undefined;
  const companyName =
    typeof job.companyName === "string" && job.companyName.trim()
      ? job.companyName.trim()
      : undefined;
  const text =
    typeof job.text === "string" && job.text.trim()
      ? job.text.trim().slice(0, MAX_TEXT_LENGTH)
      : undefined;

  const doc: JobSearchDocument = {
    id: sqliteId,
    source,
  };

  if (title) doc.title = title;
  if (companyName) doc.companyName = companyName;

  const location = normalizeLocation(job);
  if (location) doc.location = location;

  if (text) doc.text = text;

  const skills = normalizeSkills(job);
  if (skills) doc.skills = skills;

  const datePosted = normalizeDatePosted(job);
  if (datePosted) {
    doc.datePosted = datePosted;
    const timestamp = Date.parse(datePosted);
    if (Number.isFinite(timestamp)) {
      doc.datePostedTimestamp = timestamp;
    }
  }

  return doc;
}

export async function initMeilisearch(): Promise<boolean> {
  if (client && enabled) {
    return true;
  }

  if (initialization) {
    return initialization;
  }

  const config = getConfig();
  if (!config) {
    console.log("Meilisearch disabled: MEILI_HOST or MEILI_API_KEY not set");
    enabled = false;
    return false;
  }

  const now = Date.now();
  if (now - lastConnectionAttempt < RECONNECT_DELAY_MS) {
    return false;
  }
  lastConnectionAttempt = now;

  initialization = (async () => {
    try {
      const nextClient = new Meilisearch({
        host: config.host,
        apiKey: config.apiKey,
      });
      await nextClient.health();

      const index = nextClient.index(INDEX_NAME);
      const tasks = await Promise.all([
        index.updateSearchableAttributes([
          "title",
          "companyName",
          "location",
          "text",
          "skills",
        ]),
        index.updateFilterableAttributes(["source", "datePostedTimestamp"]),
        index.updateSortableAttributes(["datePostedTimestamp"]),
      ]);
      await Promise.all(
        tasks.map((task) => nextClient.waitForTask(task.taskUid)),
      );

      client = nextClient;
      enabled = true;
      console.log(`Meilisearch ready at ${config.host} (index: ${INDEX_NAME})`);
      return true;
    } catch (error) {
      enabled = false;
      client = null;
      console.warn("Meilisearch unavailable:", error);
      return false;
    }
  })();

  try {
    return await initialization;
  } finally {
    initialization = null;
  }
}

function getIndex() {
  if (!client || !enabled) {
    throw new Error("Meilisearch is not enabled");
  }
  return client.index(INDEX_NAME);
}

export async function indexJobs(docs: JobSearchDocument[]): Promise<void> {
  if (docs.length === 0) {
    return;
  }

  if (!(await initMeilisearch())) {
    throw new Error("Meilisearch is unavailable");
  }

  try {
    const task = await getIndex().addDocuments(docs, { primaryKey: "id" });
    await client!.waitForTask(task.taskUid);
  } catch (error) {
    enabled = false;
    client = null;
    throw error;
  }
}

export async function indexInsertedJobs(
  rows: Array<{ id: number; job: Record<string, unknown> }>,
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const docs = rows.map(({ id, job }) => jobToSearchDocument(String(id), job));
  await indexJobs(docs);
}

export interface JobSearchParams {
  q: string;
  source?: string | null;
  postedAfter?: number | null | undefined;
  postedBefore?: number | null | undefined;
  page: number;
  limit: number;
}

export async function searchJobs(
  params: JobSearchParams,
): Promise<{ ids: string[]; total: number }> {
  if (!(await initMeilisearch())) {
    throw new Error("Meilisearch is unavailable");
  }

  const filters: string[] = [];
  if (params.source && params.source !== "all") {
    filters.push(`source = "${params.source}"`);
  }
  if (params.postedAfter != null) {
    filters.push(`datePostedTimestamp >= ${params.postedAfter}`);
  }
  if (params.postedBefore != null) {
    filters.push(`datePostedTimestamp <= ${params.postedBefore}`);
  }

  const searchOptions: {
    limit: number;
    offset: number;
    filter?: string;
  } = {
    limit: params.limit,
    offset: (params.page - 1) * params.limit,
  };

  if (filters.length > 0) {
    searchOptions.filter = filters.join(" AND ");
  }

  let result;
  try {
    result = await getIndex().search(params.q, searchOptions);
  } catch (error) {
    enabled = false;
    client = null;
    throw error;
  }

  const ids = (result.hits as Array<{ id: string | number }>)
    .map((hit) => (typeof hit.id === "string" ? hit.id : String(hit.id)))
    .filter((id: string) => id.length > 0);

  const total = result.estimatedTotalHits ?? result.hits.length;

  return { ids, total };
}
