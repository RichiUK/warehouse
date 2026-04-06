/**
 * Cinépolis Chile scraper
 * cinepolis.cl redirects → cinepolis.com/chile (Next.js SPA)
 * Uses Playwright to intercept API calls.
 */
import { chromium } from "playwright";
import type { ScrapedMovie, ScrapedShowtime, ScrapeResult } from "./types.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  return 0;
}

function extractArray(body: unknown): unknown[] | null {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    for (const key of ["data", "movies", "films", "results", "items", "content", "peliculas", "cartelera", "billboard"]) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    for (const val of Object.values(obj)) {
      if (Array.isArray(val) && (val as unknown[]).length > 1) return val as unknown[];
    }
  }
  return null;
}

function normalizeRating(r: string): string {
  const map: Record<string, string> = {
    "TE": "TE", "TE7": "TE+7", "TE+7": "TE+7",
    "TE14": "TE+14", "TE+14": "TE+14",
    "MA14": "MA+14", "MA+14": "MA+14",
    "MA18": "MA+18", "MA+18": "MA+18",
    "ATP": "TE",
  };
  return map[(r ?? "").replace(/\s/g, "")] ?? "TE";
}

export class CinepolisScraper {
  readonly cadenaId = "cinepolis";
  readonly displayName = "Cinépolis Chile";

  async scrape(): Promise<ScrapeResult> {
    console.log("[cinepolis] Starting (Playwright)");
    const scraped_at = new Date().toISOString();
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        locale: "es-CL",
      });
      const page = await context.newPage();

      const captured: Array<{ url: string; body: unknown }> = [];

      page.on("response", async (response) => {
        const ct = response.headers()["content-type"] ?? "";
        if (!ct.includes("json")) return;
        const url = response.url();
        // Skip tiny/irrelevant responses
        try {
          const body = await response.json();
          captured.push({ url, body });
          console.log(`[cinepolis] captured: ${url.split("?")[0]}`);
        } catch { /* ignore */ }
      });

      // cinepolis.cl → redirects to cinepolis.com/chile
      await page.goto("https://www.cinepolis.com/chile", {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page.waitForTimeout(8000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(3000);

      await browser.close();

      // Find movie array — look for response with most items having title+poster fields
      let bestMovies: unknown[] | null = null;
      let bestScore = 0;

      for (const { url, body } of captured) {
        if (url.includes("cinema") && !url.includes("movie")) continue; // skip cinema lists
        const arr = extractArray(body);
        if (!arr || arr.length < 2) continue;
        const first = arr[0] as Record<string, unknown>;

        const hasTitle = "title" in first || "titulo" in first || "name" in first || "movieName" in first;
        const hasMedia = "poster" in first || "posterUrl" in first || "image" in first || "imageUrl" in first || "thumbnail" in first;
        const hasDuration = "duration" in first || "runtime" in first || "duracion" in first;
        const hasId = "id" in first || "movieId" in first || "code" in first;

        const score = (hasTitle ? 2 : 0) + (hasMedia ? 2 : 0) + (hasDuration ? 1 : 0) + (hasId ? 1 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestMovies = arr;
          console.log(`[cinepolis] Best movie array so far: ${url.split("?")[0]} (score ${score}, ${arr.length} items)`);
        }
      }

      if (!bestMovies?.length) {
        throw new Error("No movie data intercepted. Check network calls manually.");
      }

      const movies: ScrapedMovie[] = bestMovies
        .map((raw) => {
          const m = raw as Record<string, unknown>;
          const titulo = str(m.title) || str(m.titulo) || str(m.name) || str(m.movieName) || "";
          if (!titulo) return null;

          return {
            id: slugify(str(m.id) || str(m.movieId) || str(m.slug) || titulo),
            titulo,
            poster_url: str(m.posterUrl) || str(m.poster) || str(m.image) || str(m.imageUrl) || str(m.thumbnail) || "",
            genero: (() => {
              const g = m.genres ?? m.genre ?? m.genero;
              if (Array.isArray(g)) return g.map((x) => typeof x === "string" ? x : str((x as Record<string, unknown>)?.name ?? "")).filter(Boolean);
              if (typeof g === "string" && g) return [g];
              return [];
            })(),
            duracion_min: num(m.duration) || num(m.runtime) || num(m.duracion) || 0,
            clasificacion: normalizeRating(str(m.rating) || str(m.classification) || str(m.ageRating) || "TE"),
            fecha_estreno: (str(m.releaseDate) || str(m.openingDate) || "").split("T")[0],
            sinopsis: str(m.synopsis) || str(m.description) || str(m.overview) || undefined,
            cadenas_ids: ["cinepolis"],
          };
        })
        .filter((m): m is ScrapedMovie => m !== null);

      console.log(`[cinepolis] ${movies.length} movies parsed`);
      return { cadena_id: "cinepolis", movies, showtimes: [], scraped_at };
    } catch (err) {
      await browser.close().catch(() => {});
      const error = err instanceof Error ? err.message : String(err);
      console.log(`[cinepolis] ERROR: ${error}`);
      return { cadena_id: "cinepolis", movies: [], showtimes: [], error, scraped_at };
    }
  }
}
