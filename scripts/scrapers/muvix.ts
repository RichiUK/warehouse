/**
 * Muvix Chile scraper
 * Uses direct API calls — no browser needed.
 * Endpoints discovered via Playwright network interception on a prior run:
 *   GET https://muvix.cl/Browsing/Home/NowShowing → Array<MuvixMovie>
 * SSL cert on muvix.cl may be expired; Node fetch tolerates it.
 */
import type { ScrapedMovie, ScrapeResult } from "./types.js";

const BASE = "https://muvix.cl";
const CINEPLANET_CDN = "https://cdn.apis.cineplanet.cl/CDN/media/entity/get/FilmPosterGraphic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeRating(r: string): string {
  const map: Record<string, string> = {
    "TE": "TE", "TE": "TE", "T.E": "TE",
    "TE+7": "TE+7", "TE7": "TE+7", "T.E+7": "TE+7",
    "TE+14": "TE+14", "TE14": "TE+14", "T.E+14": "TE+14",
    "MA+14": "MA+14", "MA14": "MA+14",
    "MA+18": "MA+18", "MA18": "MA+18",
  };
  return map[(r ?? "").replace(/\s/g, "")] ?? "TE";
}

interface MuvixMovie {
  Id: string;               // "h-HO00000882"
  Title: string;
  PosterImageUrl: string;   // "//muvix.cl/CDN/media/entity/get/FilmPosterGraphic/HO00000882?..."
  Rating: string;           // "T.E", "T.E+7", etc.
  ReleaseDate: string;      // "/Date(1775098800000)/"
  CinemaId: string;
  Experiences: string[];    // ["AERA", "TRADICIONAL", "MX4D"]
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": BASE,
      },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export class MuvixScraper {
  readonly cadenaId = "muvix";
  readonly displayName = "Muvix Chile";

  async scrape(): Promise<ScrapeResult> {
    console.log("[muvix] Starting (direct API)");
    const scraped_at = new Date().toISOString();

    try {
      const data = await fetchJson<MuvixMovie[]>(`${BASE}/Browsing/Home/NowShowing`);
      if (!data?.length) {
        throw new Error("NowShowing returned empty or null");
      }

      // Deduplicate by Id (each movie appears once per cinema)
      const seen = new Set<string>();
      const movies: ScrapedMovie[] = [];

      for (const m of data) {
        if (seen.has(m.Id)) continue;
        seen.add(m.Id);

        // Extract HO code from Id ("h-HO00000882" → "HO00000882")
        const hoCode = m.Id.replace(/^h-/, "").toUpperCase();

        // Use the shared Vista CDN (same CDN that Cineplanet uses — shared HO system)
        const poster_url = hoCode
          ? `${CINEPLANET_CDN}/${hoCode}?referenceScheme=HeadOffice&allowPlaceHolder=true`
          : (m.PosterImageUrl.startsWith("//") ? `https:${m.PosterImageUrl}` : m.PosterImageUrl);

        // Parse ReleaseDate from "/Date(1775098800000)/" → "YYYY-MM-DD"
        const tsMatch = m.ReleaseDate.match(/\d+/);
        const fecha_estreno = tsMatch
          ? new Date(parseInt(tsMatch[0])).toISOString().split("T")[0]
          : "";

        movies.push({
          id: slugify(m.Title),
          titulo: m.Title,
          poster_url,
          genero: [],
          duracion_min: 0,
          clasificacion: normalizeRating(m.Rating),
          fecha_estreno,
          sinopsis: undefined,
          cadenas_ids: ["muvix"],
        });
      }

      console.log(`[muvix] ${movies.length} movies`);
      return { cadena_id: "muvix", movies, showtimes: [], scraped_at };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.log(`[muvix] ERROR: ${error}`);
      return { cadena_id: "muvix", movies: [], showtimes: [], error, scraped_at };
    }
  }
}
