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

export async function listPartners(): Promise<PartnerRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const records = JSON.parse(raw) as PartnerRecord[];
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

export type CreatePartnerResult =
  | { ok: true; record: PartnerRecord }
  | { ok: false; error: string };

export async function createPartner(name: string, requestedSlug: string): Promise<CreatePartnerResult> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: "Partner company name is required." };
  }

  const slug = slugify(requestedSlug || trimmedName);
  if (!slug) {
    return { ok: false, error: "Could not generate a valid slug from that name — edit it above." };
  }

  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const records = JSON.parse(raw) as PartnerRecord[];

  if (records.some((r) => r.slug === slug)) {
    return { ok: false, error: `The slug "${slug}" is already in use — edit it and try again.` };
  }

  const record: PartnerRecord = {
    slug,
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };
  records.push(record);

  const tmpFile = `${DATA_FILE}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpFile, JSON.stringify(records, null, 2));
  await fs.rename(tmpFile, DATA_FILE);

  return { ok: true, record };
}
