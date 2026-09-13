// Tests for src/transform.ts. Run against the compiled output: `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  fullPrototype,
  licenseFromNumber,
  parsePipeList,
  parsePipeNameHandle,
  releaseFlgFromNumber,
  slimMaterial,
  slimPrototype,
  statusFromNumber,
  statusToNumber,
} from "../dist/transform.js";

function rawPrototype(overrides = {}) {
  return {
    id: 8454,
    prototypeNm: "protopedia-mcp",
    summary: "summary",
    freeComment: "free comment",
    systemDescription: "system description",
    teamNm: "",
    mainUrl: "https://example.com/main.png",
    videoUrl: "https://youtu.be/xxxx",
    officialLink: "https://github.com/qurihara/protopedia-mcp",
    relatedLink: "https://example.com/a",
    relatedLink2: "",
    relatedLink3: "   ",
    relatedLink4: "https://example.com/b",
    relatedLink5: "",
    users: "栗原 一貴@qurihara",
    tags: "AI|MCP| Claude |",
    materials: "TypeScript|ProtoPedia API",
    events: "ヒーローズ・リーグ 2026@hl2026",
    awards: "",
    status: 3,
    licenseType: 1,
    releaseFlg: 2,
    viewCount: 353,
    goodCount: 7,
    commentCount: 1,
    createDate: "2026-05-19",
    releaseDate: "2026-05-19",
    updateDate: "2026-09-12",
    ...overrides,
  };
}

test("status numbers map to the ProtoPedia API values", () => {
  const expected = [
    [1, "idea"],
    [2, "developing"],
    [3, "completed"],
    [4, "memorial"],
  ];
  for (const [n, s] of expected) {
    assert.equal(statusFromNumber(n), s);
    assert.equal(statusToNumber(s), n);
  }
  assert.equal(statusFromNumber(0), "unknown");
  assert.equal(statusFromNumber(99), "unknown");
});

test("license and release flag map known values and fall back to unknown", () => {
  assert.equal(licenseFromNumber(1), "ccby");
  assert.equal(licenseFromNumber(0), "none");
  assert.equal(licenseFromNumber(2), "unknown");
  assert.equal(releaseFlgFromNumber(1), "draft");
  assert.equal(releaseFlgFromNumber(2), "public");
  assert.equal(releaseFlgFromNumber(3), "private");
  assert.equal(releaseFlgFromNumber(4), "unknown");
});

test("parsePipeList trims items and drops empty ones", () => {
  assert.deepEqual(parsePipeList("AI|MCP| Claude |"), ["AI", "MCP", "Claude"]);
  assert.deepEqual(parsePipeList(""), []);
  assert.deepEqual(parsePipeList(null), []);
  assert.deepEqual(parsePipeList(undefined), []);
});

test("parsePipeNameHandle splits on the last @", () => {
  assert.deepEqual(parsePipeNameHandle("栗原 一貴@qurihara|no handle"), [
    { name: "栗原 一貴", handle: "qurihara" },
    { name: "no handle", handle: "" },
  ]);
  assert.deepEqual(parsePipeNameHandle("a@b@c"), [{ name: "a@b", handle: "c" }]);
});

test("slimPrototype builds the URL and parses list fields", () => {
  const slim = slimPrototype(rawPrototype());
  assert.equal(slim.url, "https://protopedia.net/prototype/8454");
  assert.deepEqual(slim.relatedLinks, ["https://example.com/a", "https://example.com/b"]);
  assert.deepEqual(slim.users, [{ name: "栗原 一貴", handle: "qurihara" }]);
  assert.deepEqual(slim.tags, ["AI", "MCP", "Claude"]);
  assert.deepEqual(slim.events, [{ name: "ヒーローズ・リーグ 2026", slug: "hl2026" }]);
  assert.deepEqual(slim.awards, []);
  assert.equal(slim.status, "completed");
  assert.equal(slim.releaseFlg, "public");
});

test("slimPrototype omits the large markdown bodies; fullPrototype keeps them", () => {
  const raw = rawPrototype();
  const slim = slimPrototype(raw);
  assert.equal("freeComment" in slim, false);
  assert.equal("systemDescription" in slim, false);

  const full = fullPrototype(raw);
  assert.equal(full.freeComment, "free comment");
  assert.equal(full.systemDescription, "system description");
  assert.equal(full.url, slim.url);
});

test("slimPrototype tolerates missing fields from the API", () => {
  const slim = slimPrototype(
    rawPrototype({ prototypeNm: undefined, tags: null, viewCount: undefined }),
  );
  assert.equal(slim.prototypeNm, "");
  assert.deepEqual(slim.tags, []);
  assert.equal(slim.viewCount, 0);
});

test("slimMaterial truncates long descriptions and splits sub categories", () => {
  const m = slimMaterial({
    id: 463,
    materialNm: "ProtoPedia API",
    freeComment: "あ".repeat(600),
    companyNm: "一般社団法人 MA",
    companySlug: "ma",
    categoryNm: "API",
    subCategoryNms: "Web API, データ ,",
    providerUrl: "",
    logoUrl: "",
  });
  assert.equal(m.summary.length, 501);
  assert.ok(m.summary.endsWith("…"));
  assert.deepEqual(m.subCategoryNms, ["Web API", "データ"]);

  const short = slimMaterial({ id: 1, freeComment: "short" });
  assert.equal(short.summary, "short");
  assert.equal(short.materialNm, "");
  assert.deepEqual(short.subCategoryNms, []);
});
