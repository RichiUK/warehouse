import { BaseScraper } from "./base.js";
import type { ScrapedMovie, ScrapedShowtime } from "./types.js";

export class CinepolisScraper extends BaseScraper {
  readonly cadenaId = "cinepolis";
  readonly displayName = "Cinépolis Chile";
  readonly billboardUrl = "https://www.cinepolis.cl";

  async doScrape(): Promise<{ movies: ScrapedMovie[]; showtimes: ScrapedShowtime[] }> {
    await this.page!.goto(this.billboardUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await this.page!.waitForTimeout(6000);
    await this.page!.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page!.waitForTimeout(2000);

    // Try navigating to billboard page if on homepage
    const currentUrl = this.page!.url();
    if (!currentUrl.includes("cartelera") && !currentUrl.includes("billboard")) {
      try {
        const billboardLink = await this.page!.locator("a[href*='cartelera'], a[href*='billboard'], a[href*='movies']").first();
        const href = await billboardLink.getAttribute("href");
        if (href) {
          const fullUrl = href.startsWith("http") ? href : `https://www.cinepolis.cl${href}`;
          await this.page!.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
          await this.page!.waitForTimeout(5000);
        }
      } catch {
        // stay on current page
      }
    }

    // Try API-based parsing first
    const movieArr = this.findMovieArray();
    if (movieArr && movieArr.length > 0) {
      const movies = movieArr.map((m, i) => this.parseMovie(m as Record<string, unknown>, i));
      const showtimeArr = this.findShowtimeArray() ?? [];
      const showtimes = showtimeArr.map((s, i) => this.parseShowtime(s as Record<string, unknown>, i));
      return { movies, showtimes };
    }

    // DOM fallback
    console.log("[cinepolis] Falling back to DOM scraping...");
    const movies = await this.page!.evaluate(() => {
      const results: Array<{ titulo: string; poster_url: string; clasificacion: string }> = [];
      const selectors = [".movie-card", ".film-card", ".pelicula", "[class*='movie']", "[class*='film']", "article"];
      for (const sel of selectors) {
        const cards = document.querySelectorAll(sel);
        if (cards.length < 2) continue;
        cards.forEach((card) => {
          const titulo = card.querySelector("h2, h3, h4, .title, .titulo")?.textContent?.trim() ?? "";
          const img = card.querySelector("img");
          const poster_url = img?.src ?? img?.getAttribute("data-src") ?? "";
          const clasificacion = card.querySelector("[class*='rating'], [class*='age']")?.textContent?.trim() ?? "TE";
          if (titulo) results.push({ titulo, poster_url, clasificacion });
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
        duracion_min: 0,
        clasificacion: m.clasificacion,
        fecha_estreno: "",
        cadenas_ids: ["cinepolis"],
      })),
      showtimes: [],
    };
  }

  private parseShowtime(raw: Record<string, unknown>, index: number): ScrapedShowtime {
    return {
      id: `cinepolis-${index}`,
      pelicula_id: String(raw.movie_id ?? raw.pelicula_id ?? ""),
      cadena_id: "cinepolis",
      fecha: String(raw.date ?? raw.fecha ?? ""),
      horario: String(raw.time ?? raw.hora ?? raw.start_time ?? ""),
      sala: String(raw.format ?? raw.sala ?? raw.room ?? "2D"),
      url_compra: String(raw.url ?? raw.purchase_url ?? raw.link ?? "https://www.cinepolis.cl/comprar"),
      precio_base: Number(raw.price ?? raw.precio ?? 0),
    };
  }
}

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
