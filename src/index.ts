#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getMaterialList, getPrototypeList } from "./api.js";
import {
  fullPrototype,
  slimMaterial,
  slimPrototype,
  statusToNumber,
  type Status,
} from "./transform.js";

const TOKEN = process.env.PROTOPEDIA_API_TOKEN;
if (!TOKEN) {
  console.error(
    "[protopedia-mcp] Missing PROTOPEDIA_API_TOKEN env var. " +
      "Issue a token at https://protopedia.net/settings/application and set it before launching.",
  );
  process.exit(1);
}
const token: string = TOKEN;

const server = new McpServer({
  name: "protopedia-mcp",
  version: "0.1.0",
});

const StatusEnum = z.enum(["idea", "developing", "completed", "memorial"]);

server.tool(
  "search_prototypes",
  "Search ProtoPedia works (作品). Filters use EXACT match (not substring) on the official Japanese name fields. " +
    "Returns a slim shape (no large markdown body) — call get_prototype for full content.",
  {
    userNm: z.string().optional().describe("Exact ProtoPedia user display name"),
    tagNm: z.string().optional().describe("Exact tag name"),
    materialNm: z
      .string()
      .optional()
      .describe(
        "Exact material (素材) name. Use list_materials first to discover canonical names.",
      ),
    eventNm: z.string().optional().describe("Exact event name"),
    eventId: z.number().int().positive().optional().describe("Event ID"),
    awardNm: z.string().optional().describe("Exact award name"),
    status: StatusEnum.optional().describe(
      "1=idea, 2=developing, 3=completed, 4=memorial",
    ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Max number of results (default 20, max 100)"),
    offset: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Pagination offset (default 0)"),
  },
  async (args) => {
    const params = {
      userNm: args.userNm,
      tagNm: args.tagNm,
      materialNm: args.materialNm,
      eventNm: args.eventNm,
      eventId: args.eventId,
      awardNm: args.awardNm,
      status: args.status ? statusToNumber(args.status as Status) : undefined,
      limit: args.limit ?? 20,
      offset: args.offset ?? 0,
    };
    const raw = await getPrototypeList(token, params);
    const payload = {
      count: raw.count,
      results: (raw.results ?? []).map(slimPrototype),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    };
  },
);

server.tool(
  "get_prototype",
  "Fetch a single ProtoPedia work by its prototypeId. Returns the FULL record including freeComment and systemDescription markdown.",
  {
    prototypeId: z
      .number()
      .int()
      .positive()
      .describe("The numeric prototype ID (e.g. 1946)"),
  },
  async (args) => {
    const raw = await getPrototypeList(token, {
      prototypeId: args.prototypeId,
      limit: 1,
    });
    const first = raw.results?.[0];
    const payload = first ? fullPrototype(first) : null;
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    };
  },
);

server.tool(
  "list_materials",
  "List ProtoPedia development materials (開発素材) — frameworks, devices, APIs, etc. Useful to discover the canonical materialNm to pass to search_prototypes.",
  {
    companySlug: z
      .string()
      .optional()
      .describe('Filter by company slug (e.g. "ma" for 一般社団法人 MA)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe("Max number of results (default 50)"),
    offset: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Pagination offset (default 0)"),
  },
  async (args) => {
    const raw = await getMaterialList(token, {
      companySlug: args.companySlug,
      limit: args.limit ?? 50,
      offset: args.offset ?? 0,
    });
    const payload = {
      count: raw.count,
      results: (raw.results ?? []).map(slimMaterial),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[protopedia-mcp] listening on stdio");
}

main().catch((err) => {
  console.error("[protopedia-mcp] fatal:", err);
  process.exit(1);
});
