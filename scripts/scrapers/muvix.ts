import { BaseScraper } from "./base.js";
import type { ScrapedMovie, ScrapedShowtime } from "./types.js";

export class MuvixScraper extends BaseScraper {
  readonly cadenaId = "muvix";
  readonly displayName = "Muvix Chile";
  readonly billboardUrl = "https://www.muvix.cl";

  async doScrape(): Promise<{ movies: ScrapedMovie[]; showtimes: ScrapedShowtime[] }> {
    // Muvix has SSL certificate issues — ignore SSL errors
    await this.page!.goto(this.billboardUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await this.page!.waitForTimeout(5000);
    await this.page!.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page!.waitForTimeout(2000);

    // Check for WordPress REST API (Muvix may be on WordPress)
    const wpEndpoints = [
      `${this.billboardUrl}/wp-json/wp/v2/posts?per_page=50&_embed`,
      `${this.billboardUrl}/wp-json/wp/v2/movies?per_page=50&_embed`,
    ];

    for (const endpoint of wpEndpoints) {
      try {
        const response = await this.page!.evaluate(async (url) => {
          const r = await fetch(url);
          if (!r.ok) return null;
          return r.json();
        }, endpoint);

        if (Array.isArray(response) && response.length > 0) {
          console.log(`[muvix] Found WordPress REST API: ${endpoint}`);
          const movies = this.parseWordPressPosts(response);
          return { movies, showtimes: [] };
        }
      } catch {
        // try next
      }
    }

    // Try generic API-based parsing
    const movieArr = this.findMovieArray();
    if (movieArr && movieArr.length > 0) {
      const movies = movieArr.map((m, i) => this.parseMovie(m as Record<string, unknown>, i));
      const showtimeArr = this.findShowtimeArray() ?? [];
      const showtimes = showtimeArr.map((s, i) => this.parseShowtime(s as Record<string, unknown>, i));
      return { movies, showtimes };
    }

    // DOM fallback
    console.log("[muvix] Falling back to DOM scraping...");
    const movies = await this.page!.evaluate(() => {
      const results: Array<{ titulo: string; poster_url: string; clasificacion: string }> = [];
      const selectors = [
        ".movie-card", ".film-card", "[class*='movie']", "[class*='pelicula']",
        ".post", "article", ".entry", ".card",
      ];
      for (const sel of selectors) {
        const cards = document.querySelectorAll(sel);
        if (cards.length < 2) continue;
        cards.forEach((card) => {
          const titulo = card.querySelector("h2, h3, h4, .title, .titulo, .entry-title")?.textContent?.trim() ?? "";
          const img = card.querySelector("img");
          const poster_url = img?.src ?? img?.getAttribute("data-src") ?? "";
          const clasificacion = card.querySelector("[class*='rating'], [class*='age'], [class*='clasif']")?.textContent?.trim() ?? "TE";
          if (titulo && titulo.length > 2) results.push({ titulo, poster_url, clasificacion });
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
        cadenas_ids: ["muvix"],
      })),
      showtimes: [],
    };
  }

  private parseWordPressPosts(posts: Array<Record<string, unknown>>): ScrapedMovie[] {
    return posts.map((post, i) => {
      const titulo =
        (post.title as Record<string, unknown>)?.rendered as string ??
        String(post.title ?? `Película ${i + 1}`);

      const embedded = post._embedded as Record<string, unknown> | undefined;
      const featuredMedia = embedded?.["wp:featuredmedia"] as Array<Record<string, unknown>> | undefined;
      const poster_url =
        (featuredMedia?.[0]?.source_url as string) ??
        (featuredMedia?.[0]?.media_details as Record<string, unknown>)?.sizes as string ??
        "";

      const slug = String(post.slug ?? slugify(titulo));

      return {
        id: slug,
        titulo: titulo.replace(/<[^>]+>/g, "").trim(), // strip HTML
        poster_url: typeof poster_url === "string" ? poster_url : "",
        genero: [],
        duracion_min: 0,
        clasificacion: "TE",
        fecha_estreno: String(post.date ?? "").split("T")[0],
        sinopsis: undefined,
        cadenas_ids: ["muvix"],
      };
    });
  }

  private parseShowtime(raw: Record<string, unknown>, index: number): ScrapedShowtime {
    return {
      id: `muvix-${index}`,
      pelicula_id: String(raw.movie_id ?? raw.pelicula_id ?? ""),
      cadena_id: "muvix",
      fecha: String(raw.date ?? raw.fecha ?? ""),
      horario: String(raw.time ?? raw.hora ?? ""),
      sala: String(raw.format ?? raw.sala ?? "2D"),
      url_compra: String(raw.url ?? raw.purchase_url ?? "https://www.muvix.cl/comprar"),
      precio_base: Number(raw.price ?? raw.precio ?? 0),
    };
  }
}

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
