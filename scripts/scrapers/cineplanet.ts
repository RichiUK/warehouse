import { BaseScraper } from "./base.js";
import type { ScrapedMovie, ScrapedShowtime } from "./types.js";

export class CineplanetScraper extends BaseScraper {
  readonly cadenaId = "cineplanet";
  readonly displayName = "Cineplanet Chile";
  readonly billboardUrl = "https://www.cineplanet.cl";

  async doScrape(): Promise<{ movies: ScrapedMovie[]; showtimes: ScrapedShowtime[] }> {
    await this.page!.goto(this.billboardUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await this.page!.waitForTimeout(7000); // Cineplanet React SPA needs more time
    await this.page!.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page!.waitForTimeout(3000);

    // Try API-based parsing — Cineplanet SPA makes many API calls
    const movieArr = this.findMovieArray();
    if (movieArr && movieArr.length > 0) {
      const movies = movieArr.map((m, i) => this.parseMovie(m as Record<string, unknown>, i));

      // Try to find showtimes too
      const showtimeArr = this.findShowtimeArray() ?? [];
      const showtimes = showtimeArr.map((s, i) => this.parseShowtime(s as Record<string, unknown>, i));
      return { movies, showtimes };
    }

    // DOM fallback for React-rendered content
    console.log("[cineplanet] Falling back to DOM scraping...");
    const movies = await this.page!.evaluate(() => {
      const results: Array<{ titulo: string; poster_url: string; duracion_min: number; clasificacion: string }> = [];
      const selectors = [
        "[class*='MovieCard']", "[class*='movie-card']", "[class*='film-card']",
        "[class*='Movie']", "[class*='Pelicula']", "article", ".card",
      ];
      for (const sel of selectors) {
        const cards = document.querySelectorAll(sel);
        if (cards.length < 2) continue;
        cards.forEach((card) => {
          const titulo =
            card.querySelector("h2, h3, h4, [class*='Title'], [class*='title'], [class*='Name']")?.textContent?.trim() ?? "";
          const img = card.querySelector("img");
          const poster_url = img?.src ?? img?.getAttribute("data-src") ?? img?.getAttribute("data-lazy-src") ?? "";
          const durText =
            card.querySelector("[class*='Duration'], [class*='duration'], [class*='runtime']")?.textContent ?? "";
          const duracion_min = parseInt(durText.replace(/\D/g, "") || "0", 10);
          const clasificacion =
            card.querySelector("[class*='Rating'], [class*='Age'], [class*='Clasificacion']")?.textContent?.trim() ?? "TE";
          if (titulo) results.push({ titulo, poster_url, duracion_min, clasificacion });
        });
        if (results.length > 0) break;
      }
      return results;
    });

    return {
      movies: movies.map((m) => ({
        id: slugify(m.titulo),
        titulo: m.titulo,
        poster_url: m.poster_url,
        genero: [],
        duracion_min: m.duracion_min,
        clasificacion: m.clasificacion,
        fecha_estreno: "",
        cadenas_ids: ["cineplanet"],
      })),
      showtimes: [],
    };
  }

  private parseShowtime(raw: Record<string, unknown>, index: number): ScrapedShowtime {
    return {
      id: `cineplanet-${index}`,
      pelicula_id: String(raw.movie_id ?? raw.pelicula_id ?? raw.film_id ?? ""),
      cadena_id: "cineplanet",
      fecha: String(raw.date ?? raw.fecha ?? raw.day ?? ""),
      horario: String(raw.time ?? raw.hora ?? raw.start_time ?? raw.hour ?? ""),
      sala: String(raw.format ?? raw.sala ?? raw.room ?? "2D"),
      url_compra: String(raw.url ?? raw.purchase_url ?? raw.buy_url ?? raw.link ?? "https://www.cineplanet.cl/comprar"),
      precio_base: Number(raw.price ?? raw.precio ?? raw.amount ?? 0),
    };
  }
}

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
