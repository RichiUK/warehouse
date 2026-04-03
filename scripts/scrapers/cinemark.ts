import { BaseScraper } from "./base.js";
import type { ScrapedMovie, ScrapedShowtime } from "./types.js";

export class CinemarkScraper extends BaseScraper {
  readonly cadenaId = "cinemark";
  readonly displayName = "Cinemark Chile";
  readonly billboardUrl = "https://www.cinemark.cl/peliculas-en-cartelera";

  async doScrape(): Promise<{ movies: ScrapedMovie[]; showtimes: ScrapedShowtime[] }> {
    // Navigate and wait for dynamic content
    await this.page!.goto(this.billboardUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await this.page!.waitForTimeout(5000);

    // Try to trigger more API calls by scrolling
    await this.page!.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page!.waitForTimeout(2000);

    // ── Try API-based parsing ──
    const movieArr = this.findMovieArray();
    if (movieArr && movieArr.length > 0) {
      const movies = movieArr.map((m, i) => this.parseMovie(m as Record<string, unknown>, i));
      const showtimeArr = this.findShowtimeArray() ?? [];
      const showtimes = showtimeArr.map((s, i) => this.parseShowtime(s as Record<string, unknown>, i));
      return { movies, showtimes };
    }

    // ── Fallback: DOM scraping ──
    console.log("[cinemark] Falling back to DOM scraping...");
    const movies = await this.page!.evaluate(() => {
      const results: Array<{
        titulo: string;
        poster_url: string;
        url: string;
        duracion_min: number;
        clasificacion: string;
      }> = [];

      // Cinemark Chile renders movie cards — try multiple selector patterns
      const selectors = [
        ".movie-card",
        ".film-card",
        "[class*='movie']",
        "[class*='pelicula']",
        "[class*='film']",
        "article",
      ];

      for (const sel of selectors) {
        const cards = document.querySelectorAll(sel);
        if (cards.length < 2) continue;
        cards.forEach((card) => {
          const titulo =
            card.querySelector("h2, h3, h4, .title, .titulo, [class*='title']")?.textContent?.trim() ?? "";
          const img = card.querySelector("img");
          const poster_url = img?.src ?? img?.getAttribute("data-src") ?? "";
          const href = card.querySelector("a")?.href ?? "";
          const duracion_text =
            card.querySelector("[class*='duration'], [class*='duracion'], [class*='runtime']")?.textContent ?? "";
          const duracion_min = parseInt(duracion_text.replace(/[^\d]/g, "") || "0", 10);
          const clasificacion =
            card.querySelector("[class*='rating'], [class*='clasificacion'], [class*='classification']")?.textContent?.trim() ?? "TE";

          if (titulo) {
            results.push({ titulo, poster_url, url: href, duracion_min, clasificacion });
          }
        });
        if (results.length > 0) break;
      }
      return results;
    });

    const scrapedMovies: ScrapedMovie[] = movies.map((m, i) => ({
      id: this.slugify(m.titulo),
      titulo: m.titulo,
      poster_url: m.poster_url,
      genero: [],
      duracion_min: m.duracion_min,
      clasificacion: m.clasificacion || "TE",
      fecha_estreno: "",
      cadenas_ids: ["cinemark"],
    }));

    return { movies: scrapedMovies, showtimes: [] };
  }

  private parseShowtime(raw: Record<string, unknown>, index: number): ScrapedShowtime {
    return {
      id: `cinemark-${index}`,
      pelicula_id: String(raw.movie_id ?? raw.pelicula_id ?? raw.film_id ?? ""),
      cadena_id: "cinemark",
      fecha: String(raw.date ?? raw.fecha ?? raw.day ?? ""),
      horario: String(raw.time ?? raw.hora ?? raw.start_time ?? raw.horario ?? ""),
      sala: String(raw.format ?? raw.sala ?? raw.room ?? raw.type ?? "2D"),
      url_compra: String(raw.url ?? raw.purchase_url ?? raw.buy_url ?? raw.link ?? "https://www.cinemark.cl/comprar"),
      precio_base: Number(raw.price ?? raw.precio ?? raw.value ?? 0),
    };
  }

  private slugify(text: string): string {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
}
