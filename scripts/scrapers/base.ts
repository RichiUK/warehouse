import { chromium, type Browser, type Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import type { ScrapedMovie, ScrapedShowtime, ScrapeResult } from "./types.js";

export interface CapturedResponse {
  url: string;
  status: number;
  body: unknown;
}

export abstract class BaseScraper {
  abstract readonly cadenaId: string;
  abstract readonly displayName: string;
  abstract readonly billboardUrl: string;

  protected browser: Browser | null = null;
  protected page: Page | null = null;
  protected captured: CapturedResponse[] = [];

  private log(msg: string) {
    console.log(`[${this.cadenaId}] ${msg}`);
  }

  protected async setup() {
    this.browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      locale: "es-CL",
      timezoneId: "America/Santiago",
    });
    this.page = await context.newPage();

    // Intercept all JSON responses
    this.page.on("response", async (response) => {
      const ct = response.headers()["content-type"] ?? "";
      if (!ct.includes("application/json") && !ct.includes("text/json")) return;
      try {
        const body = await response.json();
        const url = response.url();
        this.captured.push({ url, status: response.status(), body });
        this.log(`  captured JSON (${response.status()}): ${url.split("?")[0]}`);
      } catch {
        // ignore parse errors
      }
    });
  }

  protected async teardown() {
    await this.browser?.close();
    this.browser = null;
    this.page = null;
  }

  /** Save all captured JSON responses for debugging */
  protected saveDebug() {
    const dir = path.join(process.cwd(), "data", "debug");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `${this.cadenaId}.json`),
      JSON.stringify(this.captured, null, 2)
    );
    this.log(`Saved ${this.captured.length} captured responses to data/debug/${this.cadenaId}.json`);
  }

  // ─── Heuristic helpers ──────────────────────────────────────────────────────

  /** Find a response body that looks like a list of movies */
  protected findMovieArray(): unknown[] | null {
    for (const { url, body } of this.captured) {
      const arr = extractArray(body);
      if (!arr || arr.length < 2) continue;
      const first = arr[0] as Record<string, unknown>;
      if (!first || typeof first !== "object") continue;

      const hasTitle =
        "title" in first || "titulo" in first || "name" in first ||
        "nombre" in first || "Titulo" in first || "Title" in first;
      const hasImage =
        "poster" in first || "image" in first || "thumbnail" in first ||
        "img" in first || "poster_url" in first || "poster_path" in first ||
        "imagen" in first || "banner" in first || "Poster" in first;

      if (hasTitle && hasImage) {
        this.log(`  Movie array found at: ${url.split("?")[0]} (${arr.length} items)`);
        return arr;
      }
    }
    return null;
  }

  /** Find a response body that looks like a list of showtimes */
  protected findShowtimeArray(): unknown[] | null {
    for (const { url, body } of this.captured) {
      const arr = extractArray(body);
      if (!arr || arr.length < 1) continue;
      const first = arr[0] as Record<string, unknown>;
      if (!first || typeof first !== "object") continue;

      const hasDate =
        "date" in first || "fecha" in first || "day" in first ||
        "Fecha" in first || "Date" in first || "showdate" in first;
      const hasTime =
        "time" in first || "hora" in first || "start_time" in first ||
        "horario" in first || "Horario" in first || "hour" in first;
      const hasPrice =
        "price" in first || "precio" in first || "value" in first ||
        "Precio" in first || "cost" in first || "amount" in first;

      if (hasDate && hasTime && hasPrice) {
        this.log(`  Showtime array found at: ${url.split("?")[0]} (${arr.length} items)`);
        return arr;
      }
    }
    return null;
  }

  /** Parse a raw movie object into ScrapedMovie */
  protected parseMovie(raw: Record<string, unknown>, index: number): ScrapedMovie {
    const titulo =
      str(raw.title) || str(raw.titulo) || str(raw.name) || str(raw.nombre) ||
      str(raw.Title) || str(raw.Titulo) || `Película ${index + 1}`;

    const poster_url =
      str(raw.poster_url) || str(raw.poster) || str(raw.image) || str(raw.img) ||
      str(raw.thumbnail) || str(raw.imagen) || str(raw.banner) || str(raw.Poster) ||
      buildTmdbUrl(str(raw.poster_path)) || "";

    const id =
      slug(str(raw.id) || str(raw.slug) || str(raw.code) || titulo);

    const genero = parseGenre(raw);
    const duracion_min = num(raw.duration) || num(raw.duracion) || num(raw.runtime) || 0;
    const clasificacion =
      str(raw.classification) || str(raw.clasificacion) || str(raw.rating) ||
      str(raw.age_rating) || str(raw.AgeRating) || "TE";
    const fecha_estreno =
      str(raw.release_date) || str(raw.fecha_estreno) || str(raw.releaseDate) || "";
    const sinopsis =
      str(raw.synopsis) || str(raw.sinopsis) || str(raw.overview) ||
      str(raw.description) || str(raw.descripcion) || undefined;

    return { id, titulo, poster_url, genero, duracion_min, clasificacion, fecha_estreno, sinopsis, cadenas_ids: [this.cadenaId] };
  }

  abstract doScrape(): Promise<{ movies: ScrapedMovie[]; showtimes: ScrapedShowtime[] }>;

  async scrape(): Promise<ScrapeResult> {
    this.log(`Starting scrape of ${this.billboardUrl}`);
    const scraped_at = new Date().toISOString();
    try {
      await this.setup();
      const { movies, showtimes } = await this.doScrape();
      this.saveDebug();
      this.log(`Done: ${movies.length} movies, ${showtimes.length} showtimes`);
      return { cadena_id: this.cadenaId, movies, showtimes, scraped_at };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.log(`ERROR: ${error}`);
      this.saveDebug();
      return { cadena_id: this.cadenaId, movies: [], showtimes: [], error, scraped_at };
    } finally {
      await this.teardown();
    }
  }
}

// ─── Utility functions ───────────────────────────────────────────────────────

function extractArray(body: unknown): unknown[] | null {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    for (const key of ["data", "movies", "films", "results", "items", "content", "cartelera", "peliculas", "billboard", "shows", "showtimes"]) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    // Try first array-valued property
    for (const val of Object.values(obj)) {
      if (Array.isArray(val) && val.length > 0) return val as unknown[];
    }
  }
  return null;
}

function str(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  return "";
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseGenre(raw: Record<string, unknown>): string[] {
  const g = raw.genres ?? raw.genero ?? raw.genre ?? raw.categories ?? raw.Genero ?? raw.Genre;
  if (Array.isArray(g)) {
    return g.map((x) => (typeof x === "string" ? x : str((x as Record<string, unknown>)?.name ?? (x as Record<string, unknown>)?.nombre ?? ""))).filter(Boolean);
  }
  if (typeof g === "string" && g) return [g];
  return [];
}

function buildTmdbUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w500${path.startsWith("/") ? path : "/" + path}`;
}
