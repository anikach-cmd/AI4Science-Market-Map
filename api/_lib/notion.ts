import { Client } from "@notionhq/client";

const notionToken = process.env.NOTION_TOKEN;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

const notion = notionToken ? new Client({ auth: notionToken }) : null;

export function notionConfigured(): boolean {
  return !!notion && !!notionDatabaseId;
}

export interface CompanyLike {
  id: string;
  name: string;
  websiteUrl: string;
  domain: string;
  capabilityRow: string;
  description: string;
  rationale: string;
  tag?: string;
  foundedYear?: number;
}

/** company id -> Notion page id, persisted in Redis alongside the map state. */
export type NotionPageMap = Record<string, string>;

function normalizeUrl(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function richText(value: string) {
  return [{ text: { content: value.slice(0, 2000) } }];
}

function companyProperties(c: CompanyLike): Record<string, unknown> {
  return {
    Name: { title: richText(c.name || "Untitled") },
    Website: { url: c.websiteUrl ? normalizeUrl(c.websiteUrl) : null },
    Domain: { rich_text: richText(c.domain) },
    Capability: { rich_text: richText(c.capabilityRow) },
    Description: { rich_text: richText(c.description || "") },
    Rationale: { rich_text: richText(c.rationale || "") },
    Tag: { rich_text: richText(c.tag || "") },
    "Founded Year": { number: c.foundedYear ?? null },
  };
}

function companiesEqual(a: CompanyLike, b: CompanyLike): boolean {
  return (
    a.name === b.name &&
    a.websiteUrl === b.websiteUrl &&
    a.domain === b.domain &&
    a.capabilityRow === b.capabilityRow &&
    a.description === b.description &&
    a.rationale === b.rationale &&
    a.tag === b.tag &&
    a.foundedYear === b.foundedYear
  );
}

/**
 * Best-effort mirror of the company list into a Notion database, diffed
 * against the previous save so a normal edit only touches 1-2 Notion pages.
 * Never throws — logs and returns whatever page map it managed to build,
 * so one flaky Notion call never breaks the real (Redis) save.
 */
export async function syncCompaniesToNotion(
  companies: CompanyLike[],
  previousCompanies: CompanyLike[],
  pageMap: NotionPageMap
): Promise<NotionPageMap> {
  if (!notion || !notionDatabaseId) return pageMap;

  const nextMap: NotionPageMap = { ...pageMap };
  const prevById = new Map(previousCompanies.map((c) => [c.id, c]));
  const currentIds = new Set(companies.map((c) => c.id));

  for (const prev of previousCompanies) {
    if (currentIds.has(prev.id)) continue;
    const pageId = nextMap[prev.id];
    if (!pageId) continue;
    try {
      await notion.pages.update({ page_id: pageId, archived: true });
    } catch (err) {
      console.error("Notion: failed to archive page for", prev.id, err);
    }
    delete nextMap[prev.id];
  }

  for (const company of companies) {
    const prev = prevById.get(company.id);
    const pageId = nextMap[company.id];
    if (prev && pageId && companiesEqual(prev, company)) continue;

    // Notion's SDK types properties as a large discriminated union we build
    // by hand from plain field values; the shape matches at runtime.
    const properties = companyProperties(company) as Parameters<
      typeof notion.pages.update
    >[0]["properties"];

    try {
      if (pageId) {
        await notion.pages.update({ page_id: pageId, properties });
      } else {
        const page = await notion.pages.create({
          parent: { database_id: notionDatabaseId },
          properties,
        });
        nextMap[company.id] = page.id;
      }
    } catch (err) {
      console.error("Notion: failed to sync company", company.id, err);
    }
  }

  return nextMap;
}
