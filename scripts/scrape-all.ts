/**
 * scrape-all.ts
 * Runs scrapers for all cinema chains, merges results, and writes to data/*.json
 *
 * Usage:
 *   npm run scrape
 *
 * On first run, check data/debug/*.json to see all intercepted API calls.
 * Use that info to refine the per-chain parsers.
 */
import * as fs from "fs";
import * as path from "path";
import { CinemarkScraper } from "./scrapers/cinemark.js";
import { CinepolisScraper } from "./scrapers/cinepolis.js";
import { CineplanetScraper } from "./scrapers/cineplanet.js";
import { MuvixScraper } from "./scrapers/muvix.js";
import type { ScrapedMovie, ScrapedShowtime, ScrapeResult } from "./scrapers/types.js";

const DATA_DIR = path.join(process.cwd(), "data");

// ─── Run all scrapers ────────────────────────────────────────────────────────

async function main() {
  console.log("=== CineCompara Scraper ===");
  console.log(`Started at: ${new Date().toISOString()}\n`);

  const scrapers = [
    new CinemarkScraper(),
    new CinepolisScraper(),
    new CineplanetScraper(),
    new MuvixScraper(),
  ];

  // Run scrapers (sequentially to avoid memory pressure)
  const results: ScrapeResult[] = [];
  for (const scraper of scrapers) {
    console.log(`\n--- ${scraper.displayName} ---`);
    const result = await scraper.scrape();
    results.push(result);
    if (result.error) {
      console.warn(`  ⚠ Error: ${result.error}`);
    } else {
      console.log(`  ✓ ${result.movies.length} movies, ${result.showtimes.length} showtimes`);
    }
  }

  // ─── Merge movies across chains ─────────────────────────────────────────────
  // Movies with the same title get merged into a single entry with all cadenas_ids
  const movieMap = new Map<string, ScrapedMovie>();

  for (const result of results) {
    for (const movie of result.movies) {
      const key = normalizeTitle(movie.titulo);
      if (movieMap.has(key)) {
        const existing = movieMap.get(key)!;
        // Add this chain to the existing movie entry
        if (!existing.cadenas_ids.includes(result.cadena_id)) {
          existing.cadenas_ids.push(result.cadena_id);
        }
        // Fill in missing fields
        if (!existing.poster_url && movie.poster_url) existing.poster_url = movie.poster_url;
        if (!existing.sinopsis && movie.sinopsis) existing.sinopsis = movie.sinopsis;
        if (!existing.duracion_min && movie.duracion_min) existing.duracion_min = movie.duracion_min;
        if (!existing.genero.length && movie.genero.length) existing.genero = movie.genero;
      } else {
        movieMap.set(key, { ...movie });
      }
    }
  }

  const mergedMovies = Array.from(movieMap.values());

  // ─── Collect all showtimes ───────────────────────────────────────────────────
  const allShowtimes: ScrapedShowtime[] = [];
  let showtimeIndex = 0;
  for (const result of results) {
    for (const showtime of result.showtimes) {
      // Link showtime to merged movie id
      const movieKey = normalizeTitle(getMovieTitleForId(showtime.pelicula_id, result.movies));
      const mergedMovie = movieMap.get(movieKey);
      allShowtimes.push({
        ...showtime,
        id: `f${++showtimeIndex}`,
        pelicula_id: mergedMovie?.id ?? showtime.pelicula_id,
      });
    }
  }

  // ─── Build actualizaciones ───────────────────────────────────────────────────
  const actualizaciones = results.map((r) => ({
    cadena_id: r.cadena_id,
    fecha_actualizacion: r.scraped_at,
    estado: r.error ? "sin_datos" : "ok",
  }));

  // ─── Write output ────────────────────────────────────────────────────────────
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Only overwrite if we got real data (avoid wiping data if all scrapers failed)
  const totalMovies = mergedMovies.length;
  const hadErrors = results.every((r) => !!r.error);

  if (hadErrors) {
    console.error("\n✗ All scrapers failed. Keeping existing data.");
    process.exit(1);
  }

  if (totalMovies > 0) {
    writeJson("peliculas.json", mergedMovies);
    writeJson("funciones.json", allShowtimes);
  } else {
    console.warn("\n⚠ No movies found across all chains. Keeping existing data.");
  }

  writeJson("actualizaciones.json", actualizaciones);

  console.log("\n=== Done ===");
  console.log(`Movies: ${totalMovies}`);
  console.log(`Showtimes: ${allShowtimes.length}`);
  console.log(`Errors: ${results.filter((r) => r.error).map((r) => r.cadena_id).join(", ") || "none"}`);
  console.log("\nCheck data/debug/*.json to see all intercepted API calls for parser refinement.");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function writeJson(filename: string, data: unknown) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`\nWrote ${filePath}`);
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function getMovieTitleForId(id: string, movies: ScrapedMovie[]): string {
  return movies.find((m) => m.id === id)?.titulo ?? id;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
