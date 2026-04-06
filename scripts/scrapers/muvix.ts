/**
 * Muvix Chile scraper
 * muvix.cl has an invalid/expired SSL cert — use ignoreHTTPSErrors.
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
    for (const key of ["data", "movies", "films", "results", "items", "content", "peliculas", "cartelera"]) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    for (const val of Object.values(obj)) {
      if (Array.isArray(val) && (val as unknown[]).length > 1) return val as unknown[];
    }
  }
  return null;
}

export class MuvixScraper {
  readonly cadenaId = "muvix";
  readonly displayName = "Muvix Chile";

  async scrape(): Promise<ScrapeResult> {
    console.log("[muvix] Starting (Playwright, ignoreHTTPSErrors)");
    const scraped_at = new Date().toISOString();
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        locale: "es-CL",
        ignoreHTTPSErrors: true, // muvix.cl has expired/invalid SSL
      });
      const page = await context.newPage();

      const captured: Array<{ url: string; body: unknown }> = [];

      page.on("response", async (response) => {
        const ct = response.headers()["content-type"] ?? "";
        if (!ct.includes("json")) return;
        try {
          const body = await response.json();
          captured.push({ url: response.url(), body });
          console.log(`[muvix] captured: ${response.url().split("?")[0]}`);
        } catch { /* ignore */ }
      });

      await page.goto("https://www.muvix.cl", {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page.waitForTimeout(7000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(3000);

      // Try WordPress REST API (muvix may be on WP)
      for (const endpoint of [
        "https://www.muvix.cl/wp-json/wp/v2/posts?per_page=50",
        "https://www.muvix.cl/wp-json/muvix/v1/movies",
        "https://www.muvix.cl/wp-json/wp/v2/pelicula?per_page=50",
      ]) {
        try {
          const body = await page.evaluate(async (url) => {
            const r = await fetch(url);
            if (!r.ok) return null;
            return r.json();
          }, endpoint);
          if (body) {
            captured.push({ url: endpoint, body });
            console.log(`[muvix] WP endpoint worked: ${endpoint}`);
          }
        } catch { /* try next */ }
      }

      await browser.close();

      // Find best movie array
      let movies: ScrapedMovie[] = [];

      for (const { url, body } of captured) {
        const arr = extractArray(body);
        if (!arr || arr.length < 2) continue;
        const first = arr[0] as Record<string, unknown>;

        const hasTitle = "title" in first || "titulo" in first || "name" in first;
        const hasMedia = "poster" in first || "posterUrl" in first || "image" in first ||
          "featured_media" in first || "_embedded" in first || "thumbnail" in first;

        if (!hasTitle) continue;

        console.log(`[muvix] Using array from: ${url.split("?")[0]} (${arr.length} items)`);

        movies = arr
          .map((raw) => {
            const m = raw as Record<string, unknown>;

            // WordPress post shape
            if ("rendered" in (m.title as Record<string, unknown> ?? {})) {
              return parseWPPost(m);
            }

            const titulo = str(m.title) || str(m.titulo) || str(m.name) || "";
            if (!titulo) return null;

            const embedded = m._embedded as Record<string, unknown> | undefined;
            const featuredMedia = embedded?.["wp:featuredmedia"] as Array<Record<string, unknown>> | undefined;
            const poster_url =
              str(m.poster) || str(m.posterUrl) || str(m.image) ||
              (featuredMedia?.[0]?.source_url as string) || "";

            return {
              id: slugify(str(m.id) || str(m.slug) || titulo),
              titulo,
              poster_url,
              genero: [],
              duracion_min: num(m.duration) || num(m.runtime) || 0,
              clasificacion: "TE",
              fecha_estreno: (str(m.releaseDate) || str(m.date) || "").split("T")[0],
              sinopsis: str(m.synopsis) || str(m.description) || undefined,
              cadenas_ids: ["muvix"],
            };
          })
          .filter((m): m is ScrapedMovie => m !== null);

        if (movies.length > 0) break;
      }

      console.log(`[muvix] ${movies.length} movies`);
      return { cadena_id: "muvix", movies, showtimes: [], scraped_at };
    } catch (err) {
      await browser.close().catch(() => {});
      const error = err instanceof Error ? err.message : String(err);
      console.log(`[muvix] ERROR: ${error}`);
      return { cadena_id: "muvix", movies: [], showtimes: [], error, scraped_at };
    }
  }
}

function parseWPPost(post: Record<string, unknown>): ScrapedMovie | null {
  const titleObj = post.title as Record<string, unknown> | undefined;
  const titulo = str(titleObj?.rendered || "").replace(/<[^>]+>/g, "").trim();
  if (!titulo) return null;

  const embedded = post._embedded as Record<string, unknown> | undefined;
  const featuredMedia = embedded?.["wp:featuredmedia"] as Array<Record<string, unknown>> | undefined;
  const poster_url = (featuredMedia?.[0]?.source_url as string) ?? "";

  return {
    id: slugify(str(post.slug) || titulo),
    titulo,
    poster_url,
    genero: [],
    duracion_min: 0,
    clasificacion: "TE",
    fecha_estreno: str(post.date).split("T")[0],
    sinopsis: undefined,
    cadenas_ids: ["muvix"],
  };
}
