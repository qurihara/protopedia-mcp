export interface RawPrototype {
  id: number;
  prototypeNm: string;
  summary: string;
  freeComment: string;
  systemDescription: string;
  teamNm: string;
  mainUrl: string;
  videoUrl: string;
  officialLink: string;
  relatedLink: string;
  relatedLink2: string;
  relatedLink3: string;
  relatedLink4: string;
  relatedLink5: string;
  users: string;
  tags: string;
  materials: string;
  events: string;
  awards: string;
  status: number;
  licenseType: number;
  releaseFlg: number;
  viewCount: number;
  goodCount: number;
  commentCount: number;
  createDate: string;
  releaseDate: string;
  updateDate: string;
  [key: string]: unknown;
}

export interface RawMaterial {
  id: number;
  materialNm: string;
  freeComment: string;
  companyNm: string;
  companySlug: string;
  categoryNm: string;
  subCategoryNms: string;
  providerUrl: string;
  logoUrl: string;
  [key: string]: unknown;
}

export type Status = "idea" | "developing" | "completed" | "memorial";
export type LicenseType = "ccby" | "none";
export type ReleaseFlg = "draft" | "public" | "private";

export interface SlimPrototype {
  id: number;
  url: string;
  prototypeNm: string;
  summary: string;
  teamNm: string;
  mainUrl: string;
  videoUrl: string;
  officialLink: string;
  relatedLinks: string[];
  users: { name: string; handle: string }[];
  tags: string[];
  materials: string[];
  events: { name: string; slug: string }[];
  awards: string[];
  status: Status | "unknown";
  licenseType: LicenseType | "unknown";
  releaseFlg: ReleaseFlg | "unknown";
  viewCount: number;
  goodCount: number;
  commentCount: number;
  createDate: string;
  releaseDate: string;
  updateDate: string;
}

export interface FullPrototype extends SlimPrototype {
  freeComment: string;
  systemDescription: string;
}

export interface SlimMaterial {
  id: number;
  materialNm: string;
  summary: string;
  companyNm: string;
  companySlug: string;
  categoryNm: string;
  subCategoryNms: string[];
  providerUrl: string;
  logoUrl: string;
}

const STATUS_FROM: Record<number, Status> = {
  1: "idea",
  2: "developing",
  3: "completed",
  4: "memorial",
};
const STATUS_TO: Record<Status, number> = {
  idea: 1,
  developing: 2,
  completed: 3,
  memorial: 4,
};

export function statusFromNumber(n: number): Status | "unknown" {
  return STATUS_FROM[n] ?? "unknown";
}

export function statusToNumber(s: Status): number {
  return STATUS_TO[s];
}

export function licenseFromNumber(n: number): LicenseType | "unknown" {
  if (n === 1) return "ccby";
  if (n === 0) return "none";
  return "unknown";
}

export function releaseFlgFromNumber(n: number): ReleaseFlg | "unknown" {
  if (n === 1) return "draft";
  if (n === 2) return "public";
  if (n === 3) return "private";
  return "unknown";
}

export function parsePipeList(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split("|")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

export function parsePipeNameHandle(
  s: string | null | undefined,
): { name: string; handle: string }[] {
  return parsePipeList(s).map((item) => {
    const at = item.lastIndexOf("@");
    if (at < 0) return { name: item, handle: "" };
    return { name: item.slice(0, at), handle: item.slice(at + 1) };
  });
}

function collectRelatedLinks(p: RawPrototype): string[] {
  return [
    p.relatedLink,
    p.relatedLink2,
    p.relatedLink3,
    p.relatedLink4,
    p.relatedLink5,
  ].filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

export function slimPrototype(p: RawPrototype): SlimPrototype {
  return {
    id: p.id,
    url: `https://protopedia.net/prototype/${p.id}`,
    prototypeNm: p.prototypeNm ?? "",
    summary: p.summary ?? "",
    teamNm: p.teamNm ?? "",
    mainUrl: p.mainUrl ?? "",
    videoUrl: p.videoUrl ?? "",
    officialLink: p.officialLink ?? "",
    relatedLinks: collectRelatedLinks(p),
    users: parsePipeNameHandle(p.users),
    tags: parsePipeList(p.tags),
    materials: parsePipeList(p.materials),
    events: parsePipeNameHandle(p.events).map((e) => ({
      name: e.name,
      slug: e.handle,
    })),
    awards: parsePipeList(p.awards),
    status: statusFromNumber(p.status),
    licenseType: licenseFromNumber(p.licenseType),
    releaseFlg: releaseFlgFromNumber(p.releaseFlg),
    viewCount: p.viewCount ?? 0,
    goodCount: p.goodCount ?? 0,
    commentCount: p.commentCount ?? 0,
    createDate: p.createDate ?? "",
    releaseDate: p.releaseDate ?? "",
    updateDate: p.updateDate ?? "",
  };
}

export function fullPrototype(p: RawPrototype): FullPrototype {
  return {
    ...slimPrototype(p),
    freeComment: p.freeComment ?? "",
    systemDescription: p.systemDescription ?? "",
  };
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max) + "…";
}

export function slimMaterial(m: RawMaterial): SlimMaterial {
  return {
    id: m.id,
    materialNm: m.materialNm ?? "",
    summary: truncate(m.freeComment ?? "", 500),
    companyNm: m.companyNm ?? "",
    companySlug: m.companySlug ?? "",
    categoryNm: m.categoryNm ?? "",
    subCategoryNms: (m.subCategoryNms ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0),
    providerUrl: m.providerUrl ?? "",
    logoUrl: m.logoUrl ?? "",
  };
}
