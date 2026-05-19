import type { RawMaterial, RawPrototype } from "./transform.js";

const BASE_URL = "https://protopedia.net/v2";
const TIMEOUT_MS = 30_000;

export interface ListResponse<T> {
  metadata: { status: number; title: string; detail: string };
  count: number;
  links: { self: { href: string } };
  results: T[];
}

export interface PrototypeListParams {
  userNm?: string;
  materialNm?: string;
  tagNm?: string;
  eventNm?: string;
  eventId?: number;
  awardNm?: string;
  prototypeId?: number;
  status?: number;
  limit?: number;
  offset?: number;
}

export interface MaterialListParams {
  companySlug?: string;
  limit?: number;
  offset?: number;
}

function buildQuery(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.append(k, String(v));
  return `?${sp.toString()}`;
}

async function protopediaFetch<T>(
  token: string,
  path: string,
  params: Record<string, unknown>,
): Promise<T> {
  const url = `${BASE_URL}${path}${buildQuery(params)}`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: ac.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`ProtoPedia API network error: ${msg} (url=${url})`);
  }
  clearTimeout(timer);
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(
      `ProtoPedia API ${res.status} ${res.statusText}: ${bodyText.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

export function getPrototypeList(
  token: string,
  params: PrototypeListParams,
): Promise<ListResponse<RawPrototype>> {
  return protopediaFetch<ListResponse<RawPrototype>>(
    token,
    "/api/prototype/list",
    params as Record<string, unknown>,
  );
}

export function getMaterialList(
  token: string,
  params: MaterialListParams,
): Promise<ListResponse<RawMaterial>> {
  return protopediaFetch<ListResponse<RawMaterial>>(
    token,
    "/api/material/list",
    params as Record<string, unknown>,
  );
}
