/**
 * Cineplanet Chile scraper
 * Uses Playwright to intercept the /v3/api/cache/moviescache and sessioncache APIs.
 * These endpoints require a browser session (403 on direct fetch).
 *
 * Discovered endpoints:
 *   GET https://www.cineplanet.cl/v3/api/cache/moviescache  → movie list
 *   GET https://www.cineplanet.cl/v3/api/cache/sessioncache → showtimes
 *   GET https://www.cineplanet.cl/v3/api/cache/cinemascache → cinemas (ignored)
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

function normalizeRating(r: string): string {
  const map: Record<string, string> = {
    "TE": "TE", "TE7": "TE+7", "TE+7": "TE+7",
    "TE14": "TE+14", "TE+14": "TE+14",
    "MA14": "MA+14", "MA+14": "MA+14",
    "MA18": "MA+18", "MA+18": "MA+18",
  };
  return map[(r ?? "").replace(/\s/g, "")] ?? "TE";
}

export class CineplanetScraper {
  readonly cadenaId = "cineplanet";
  readonly displayName = "Cineplanet Chile";

  async scrape(): Promise<ScrapeResult> {
    console.log("[cineplanet] Starting (Playwright + network interception)");
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

      let moviesRaw: unknown = null;
      let sessionsRaw: unknown = null;

      // Intercept specific endpoints by URL
      page.on("response", async (response) => {
        const url = response.url();
        const ct = response.headers()["content-type"] ?? "";
        if (!ct.includes("json")) return;
        try {
          if (url.includes("moviescache")) {
            moviesRaw = await response.json();
            console.log(`[cineplanet] ✓ moviescache intercepted`);
          } else if (url.includes("sessioncache")) {
            sessionsRaw = await response.json();
            console.log(`[cineplanet] ✓ sessioncache intercepted`);
          }
        } catch { /* ignore */ }
      });

      await page.goto("https://www.cineplanet.cl", {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page.waitForTimeout(8000);

      // If sessioncache not loaded yet, scroll to trigger lazy loading
      if (!sessionsRaw) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(3000);
      }

      await browser.close();

      if (!moviesRaw) {
        throw new Error("moviescache not intercepted — check data/debug/cineplanet.json");
      }

      // Parse movies
      const moviesArr = extractArray(moviesRaw);
      if (!moviesArr?.length) {
        throw new Error(`Unexpected moviescache shape: ${JSON.stringify(moviesRaw).slice(0, 200)}`);
      }

      console.log(`[cineplanet] ${moviesArr.length} movies in moviescache`);

      const movies: ScrapedMovie[] = (moviesArr
        .map((raw) => {
          const m = raw as Record<string, unknown>;
          const titulo =
            str(m.title) || str(m.titulo) || str(m.name) || str(m.movieName) || "";
          if (!titulo) return null;

          const poster_url =
            str(m.posterUrl) || str(m.poster_url) || str(m.poster) ||
            str(m.image) || str(m.img) || str(m.imageUrl) || "";

          const duracion_min =
            num(m.duration) || num(m.runtime) || num(m.duracion) ||
            num(m.durationMinutes) || 0;

          const generos = parseGenre(m);
          const clasificacion = normalizeRating(
            str(m.rating) || str(m.classification) || str(m.ageRating) || "TE"
          );
          const fecha_estreno = (str(m.releaseDate) || str(m.openingDate) || "").split("T")[0];
          const sinopsis = str(m.synopsis) || str(m.description) || str(m.overview) || undefined;
          const id = str(m.id) || str(m.movieId) || str(m.slug) || slugify(titulo);

          return {
            id: slugify(id),
            titulo,
            poster_url,
            genero: generos,
            duracion_min,
            clasificacion,
            fecha_estreno,
            sinopsis,
            cadenas_ids: ["cineplanet"],
          };
        })
        .filter((m): m is NonNullable<typeof m> => m !== null)) as ScrapedMovie[];

      // Parse sessions
      const sessionsArr = extractArray(sessionsRaw) ?? [];
      console.log(`[cineplanet] ${sessionsArr.length} sessions in sessioncache`);

      const showtimes: ScrapedShowtime[] = sessionsArr
        .map((raw, i) => {
          const s = raw as Record<string, unknown>;
          const movieId =
            str(s.movieId) || str(s.movie_id) || str(s.filmId) || "";
          const fecha = (str(s.date) || str(s.fecha) || str(s.day) || "").split("T")[0];
          const horario = str(s.time) || str(s.hour) || str(s.startTime) || str(s.hora) || "";
          const precio_base = num(s.price) || num(s.precio) || num(s.amount) || 5500;

          return {
            id: `cineplanet-${i}`,
            pelicula_id: slugify(movieId),
            cadena_id: "cineplanet",
            fecha,
            horario: horario.slice(0, 5),
            sala: str(s.format) || str(s.sala) || "2D",
            url_compra: str(s.purchaseUrl) || str(s.url) || "https://www.cineplanet.cl/comprar",
            precio_base,
          };
        })
        .filter((s) => s.fecha && s.pelicula_id);

      return { cadena_id: "cineplanet", movies, showtimes, scraped_at };
    } catch (err) {
      await browser.close().catch(() => {});
      const error = err instanceof Error ? err.message : String(err);
      console.log(`[cineplanet] ERROR: ${error}`);
      return { cadena_id: "cineplanet", movies: [], showtimes: [], error, scraped_at };
    }
  }
}

function extractArray(body: unknown): unknown[] | null {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    for (const key of ["data", "movies", "films", "results", "items", "content", "list", "peliculas", "billboard"]) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    for (const val of Object.values(obj)) {
      if (Array.isArray(val) && val.length > 0) return val as unknown[];
    }
  }
  return null;
}

function str(v: unknown): string {
  if (typeof v === "string") return v.trim();
  return "";
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  return 0;
}

function parseGenre(m: Record<string, unknown>): string[] {
  const g = m.genres ?? m.genre ?? m.genero ?? m.categories ?? m.category;
  if (Array.isArray(g)) {
    return g.map((x) => typeof x === "string" ? x : str((x as Record<string, unknown>)?.name ?? "")).filter(Boolean);
  }
  if (typeof g === "string" && g) return [g];
  return [];
}
