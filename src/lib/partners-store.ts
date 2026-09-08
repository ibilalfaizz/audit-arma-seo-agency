import { promises as fs } from "fs";
import path from "path";
import { slugify } from "./slugify";

export interface PartnerRecord {
  slug: string;
  name: string;
  // null for partners migrated from the old seed file, whose real signup date is unknown
  createdAt: string | null;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "partners.json");
const SEED_FILE = path.join(DATA_DIR, "partners.seed.json");

async function ensureStore(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
    return;
  } catch {
    // fall through to bootstrap from the seed file below
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  let seeded: PartnerRecord[] = [];
  try {
    const raw = await fs.readFile(SEED_FILE, "utf8");
    const seedMap = JSON.parse(raw) as Record<string, string>;
    seeded = Object.entries(seedMap).map(([slug, name]) => ({
      slug,
      name,
      createdAt: null,
    }));
  } catch {
    seeded = [];
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(seeded, null, 2));
}

async function readRecords(): Promise<PartnerRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as PartnerRecord[];
}

async function writeRecords(records: PartnerRecord[]): Promise<void> {
  const tmpFile = `${DATA_FILE}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpFile, JSON.stringify(records, null, 2));
  await fs.rename(tmpFile, DATA_FILE);
}

export async function listPartners(): Promise<PartnerRecord[]> {
  const records = await readRecords();
  return [...records].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getPartnerMap(): Promise<Record<string, string>> {
  const records = await listPartners();
  const map: Record<string, string> = {};
  for (const record of records) {
    map[record.slug] = record.name;
  }
  return map;
}

export type PartnerMutationResult =
  | { ok: true; record: PartnerRecord }
  | { ok: false; error: string };

export async function createPartner(name: string, requestedSlug: string): Promise<PartnerMutationResult> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: "Partner company name is required." };
  }

  const slug = slugify(requestedSlug || trimmedName);
  if (!slug) {
    return { ok: false, error: "Could not generate a valid slug from that name — edit it above." };
  }

  const records = await readRecords();
  if (records.some((r) => r.slug === slug)) {
    return { ok: false, error: `The slug "${slug}" is already in use — edit it and try again.` };
  }

  const record: PartnerRecord = {
    slug,
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };
  await writeRecords([...records, record]);

  return { ok: true, record };
}

export async function updatePartner(originalSlug: string, name: string, requestedSlug: string): Promise<PartnerMutationResult> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: "Partner company name is required." };
  }

  const newSlug = slugify(requestedSlug || trimmedName);
  if (!newSlug) {
    return { ok: false, error: "Could not generate a valid slug from that name — edit it above." };
  }

  const records = await readRecords();
  const index = records.findIndex((r) => r.slug === originalSlug);
  if (index === -1) {
    return { ok: false, error: "That partner link no longer exists — refresh and try again." };
  }

  if (newSlug !== originalSlug && records.some((r) => r.slug === newSlug)) {
    return { ok: false, error: `The slug "${newSlug}" is already in use — edit it and try again.` };
  }

  const updated: PartnerRecord = { ...records[index], name: trimmedName, slug: newSlug };
  const next = [...records];
  next[index] = updated;
  await writeRecords(next);

  return { ok: true, record: updated };
}

export async function deletePartner(slug: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const records = await readRecords();
  const next = records.filter((r) => r.slug !== slug);
  if (next.length === records.length) {
    return { ok: false, error: "That partner link no longer exists — refresh and try again." };
  }
  await writeRecords(next);
  return { ok: true };
}
