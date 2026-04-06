/**
 * Cinemark Chile scraper
 * Uses the public Vista API — no browser needed.
 *
 * API endpoints discovered:
 *   GET https://api.cinemark.cl/api/vista/data/theatres
 *     → list of all cinemas with IDs
 *   GET https://api.cinemark.cl/api/vista/data/billboard?cinema_id=XXXX
 *     → [{date, movies: [{title, runtime, rating, genre, synopsis, movie_versions: [{title, sessions: [{showtime, day, hour}]}]}]}]
 */
import type { ScrapedMovie, ScrapedShowtime, ScrapeResult } from "./types.js";

const BASE = "https://api.cinemark.cl/api/vista/data";

interface Theatre {
  ID: string;
  Name: string;
  City: string;
  Slug: string;
}

interface Session {
  id: string;
  showtime: string;
  day: string;
  hour: string;
}

interface MovieVersion {
  title: string;
  id: string;
  sessions: Session[];
}

interface BillboardMovie {
  title: string;
  trailer_url: string;
  graphic_url: string;
  runtime: string;
  rating: string;
  corporate_film_id: string;
  film_HO_code: string;
  synopsis: string;
  opening_date: string;
  genre: string;
  genre2: string | null;
  genre3: string | null;
  movie_versions: MovieVersion[];
}

interface BillboardDay {
  date: string;
  movies: BillboardMovie[];
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://www.cinemark.cl/",
};

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

/** Detect format from version title (e.g. "HOPPERS (2D DOB)", "SCREAM 7 (IMAX)") */
function detectFormat(versionTitle: string): string {
  const t = versionTitle.toUpperCase();
  if (t.includes("IMAX")) return "IMAX";
  if (t.includes("4DX")) return "4DX";
  if (t.includes("XD")) return "XD";
  if (t.includes("3D")) return "3D";
  return "2D";
}

/** Rough price by format */
function priceForFormat(format: string): number {
  switch (format) {
    case "IMAX": return 9500;
    case "4DX":  return 10500;
    case "XD":   return 8500;
    case "3D":   return 7500;
    default:     return 6200;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeRating(rating: string): string {
  const map: Record<string, string> = {
    "TE": "TE", "TE+7": "TE+7", "TE+14": "TE+14",
    "MA14": "MA+14", "MA+14": "MA+14",
    "MA18": "MA+18", "MA+18": "MA+18",
  };
  return map[rating.trim()] ?? "TE";
}

export class CinemarkScraper {
  readonly cadenaId = "cinemark";
  readonly displayName = "Cinemark Chile";

  async scrape(): Promise<ScrapeResult> {
    console.log("[cinemark] Starting (direct API, no browser)");
    const scraped_at = new Date().toISOString();

    try {
      // Step 1: get all theatres
      const theatresData = await fetchJSON<{ cinemas: Theatre[] }>(`${BASE}/theatres`);
      if (!theatresData?.cinemas?.length) {
        throw new Error("Could not fetch theatres list");
      }

      const allCinemas = theatresData.cinemas;
      console.log(`[cinemark] Found ${allCinemas.length} cinemas`);

      // Step 2: fetch billboard for every cinema (deduplicate movies by corporate_film_id)
      const movieMap = new Map<string, BillboardMovie & { cinemaId: string }>();
      const allSessions: Array<{ cinemaId: string; cinemaSlug: string; movie: BillboardMovie; version: MovieVersion; session: Session }> = [];

      for (const cinema of allCinemas) {
        const billboard = await fetchJSON<BillboardDay[]>(`${BASE}/billboard?cinema_id=${cinema.ID}`);
        if (!billboard?.length) continue;

        for (const day of billboard) {
          for (const movie of day.movies ?? []) {
            const key = movie.corporate_film_id || movie.film_HO_code || slugify(movie.title);
            if (!movieMap.has(key)) {
              movieMap.set(key, { ...movie, cinemaId: cinema.ID });
            }
            for (const version of movie.movie_versions ?? []) {
              for (const session of version.sessions ?? []) {
                allSessions.push({ cinemaId: cinema.ID, cinemaSlug: cinema.Slug, movie, version, session });
              }
            }
          }
        }
      }

      console.log(`[cinemark] ${movieMap.size} unique movies, ${allSessions.length} sessions`);

      // Step 3: build ScrapedMovie list
      const movies: ScrapedMovie[] = Array.from(movieMap.values()).map((m) => {
        const generos = [m.genre, m.genre2, m.genre3].filter(Boolean) as string[];
        // Try Cinemark's CDN pattern for posters
        const poster_url = m.graphic_url ||
          `https://www.cinemark.cl/media/images/movies/${m.corporate_film_id}/poster.jpg`;

        return {
          id: slugify(m.title),
          titulo: titleCase(m.title),
          poster_url,
          genero: generos,
          duracion_min: parseInt(m.runtime ?? "0", 10),
          clasificacion: normalizeRating(m.rating ?? "TE"),
          fecha_estreno: m.opening_date ? m.opening_date.split("T")[0] : "",
          sinopsis: m.synopsis || undefined,
          cadenas_ids: ["cinemark"],
        };
      });

      // Step 4: build ScrapedShowtime list
      const showtimes: ScrapedShowtime[] = allSessions.map((s, i) => {
        const format = detectFormat(s.version.title);
        return {
          id: `cinemark-${i}`,
          pelicula_id: slugify(s.movie.title),
          cadena_id: "cinemark",
          fecha: s.session.day,
          horario: s.session.hour.slice(0, 5),
          sala: format,
          url_compra: `https://www.cinemark.cl/pelicula/${slugify(s.movie.title)}`,
          precio_base: priceForFormat(format),
        };
      });

      return { cadena_id: "cinemark", movies, showtimes, scraped_at };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.log(`[cinemark] ERROR: ${error}`);
      return { cadena_id: "cinemark", movies: [], showtimes: [], error, scraped_at };
    }
  }
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
