import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  notionConfigured,
  syncCompaniesToNotion,
  type CompanyLike,
  type NotionPageMap,
} from "./_lib/notion";

const STATE_KEY = "map-state";
const NOTION_PAGE_MAP_KEY = "notion-page-map";

// Works with the env var names injected by either the Upstash-for-Redis or
// legacy Vercel KV marketplace integration — whichever is present.
const url =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

interface MapState {
  title: string;
  companies: CompanyLike[];
  labelOverrides?: Record<string, string>;
}

function isMapState(value: unknown): value is MapState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === "string" && Array.isArray(v.companies);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!redis) {
    // No Redis integration added to this Vercel project yet — tell the
    // client so it can keep using localStorage/seed data until it is.
    if (req.method === "GET") {
      res.status(200).json(null);
      return;
    }
    res.status(503).json({ error: "No Redis storage configured for this project yet." });
    return;
  }

  if (req.method === "GET") {
    try {
      const state = await redis.get(STATE_KEY);
      res.status(200).json(state ?? null);
    } catch {
      res.status(200).json(null);
    }
    return;
  }

  if (req.method === "POST") {
    if (!isMapState(req.body)) {
      res.status(400).json({ error: "Expected { title, companies, labelOverrides? }" });
      return;
    }

    let previous: MapState | null = null;
    try {
      previous = (await redis.get<MapState>(STATE_KEY)) ?? null;
    } catch {
      previous = null;
    }

    try {
      await redis.set(STATE_KEY, req.body);
    } catch {
      res.status(500).json({ error: "Failed to save state" });
      return;
    }

    // Redis is the real save and has already succeeded above — Notion is a
    // best-effort mirror. Any failure here must never fail this request.
    if (notionConfigured()) {
      try {
        const previousPageMap =
          (await redis.get<NotionPageMap>(NOTION_PAGE_MAP_KEY)) ?? {};
        const nextPageMap = await syncCompaniesToNotion(
          req.body.companies,
          previous?.companies ?? [],
          previousPageMap
        );
        await redis.set(NOTION_PAGE_MAP_KEY, nextPageMap);
      } catch (err) {
        console.error("Notion mirror sync failed", err);
      }
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed" });
}
