import { createReader } from "@keystatic/core/reader";
import sharp from "sharp";
import path from "node:path";
import keystaticConfig from "../../keystatic.config";
import { PARTNER_IMAGES_PATH, PEOPLE_IMAGES_PATH } from "./image-paths";

const reader = createReader(process.cwd(), keystaticConfig);

/**
 * Replaces `{{token}}` placeholders throughout any nested string/array/object
 * value. Lets a single Keystatic field (e.g. `teamCount`) be the one place
 * an editor updates a number that would otherwise need editing separately
 * in every stat block and paragraph that mentions it — those just contain
 * `{{teamCount}}` instead of a hardcoded number, so they can never drift
 * out of sync with each other.
 */
function applyTokens<T>(value: T, tokens: Record<string, string>): T {
  if (typeof value === "string") {
    let text: string = value;
    for (const [token, replacement] of Object.entries(tokens)) {
      text = text.replaceAll(`{{${token}}}`, replacement);
    }
    return text as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyTokens(item, tokens)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        applyTokens(val, tokens),
      ]),
    ) as T;
  }
  return value;
}

/** All editorial copy for the single home page, read from the Keystatic singleton. */
export async function getHomeContent() {
  const home = await reader.singletons.home.read();
  if (!home) {
    throw new Error(
      "Home content singleton is missing at src/content/pages/home",
    );
  }
  return applyTokens(home, { teamCount: home.teamCount });
}

/** Resolved shape of the home singleton (inferred from the Keystatic schema). */
export type HomeContent = NonNullable<
  Awaited<ReturnType<typeof reader.singletons.home.read>>
>;

/** A partner logo entry, with the logo resolved to a public image path and its intrinsic size. */
export interface PartnerLogo {
  slug: string;
  name: string;
  category: string;
  order: number;
  logo: string;
  width: number | null;
  height: number | null;
}

/** Reads a public/-relative image's intrinsic pixel size; null if it can't be read (e.g. missing file). */
async function readImageSize(
  publicPath: string,
): Promise<{ width: number | null; height: number | null }> {
  try {
    const { width, height } = await sharp(
      path.join(process.cwd(), "public", publicPath),
    ).metadata();
    return { width: width ?? null, height: height ?? null };
  } catch {
    return { width: null, height: null };
  }
}

/** All partner logos, read from the `partnerLogos` collection. */
export async function getPartnerLogos(): Promise<PartnerLogo[]> {
  const all = await reader.collections.partnerLogos.all();
  return Promise.all(
    all.map(async ({ slug, entry }) => {
      const logo = entry.logo ? `${PARTNER_IMAGES_PATH}${entry.logo}` : "";
      const { width, height } = logo
        ? await readImageSize(logo)
        : { width: null, height: null };
      return {
        slug,
        name: entry.name,
        category: entry.category,
        order: entry.order ?? 0,
        logo,
        width,
        height,
      };
    }),
  );
}

/** A mentor/expert/trainer entry, with the photo resolved to a public image path. */
export interface PersonEntry {
  slug: string;
  name: string;
  group: string;
  order: number;
  role: string;
  bio: string;
  linkedin: string;
  photo: string;
}

/** All mentors/experts/trainers, read from the `people` collection. */
export async function getPeople(): Promise<PersonEntry[]> {
  const all = await reader.collections.people.all();
  return all.map(({ slug, entry }) => ({
    slug,
    name: entry.name,
    group: entry.group,
    order: entry.order ?? 0,
    role: entry.role,
    bio: entry.bio,
    linkedin: entry.linkedin,
    photo: entry.photo ? `${PEOPLE_IMAGES_PATH}${entry.photo}` : "",
  }));
}
