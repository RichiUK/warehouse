export interface ScrapedMovie {
  id: string;
  titulo: string;
  poster_url: string;
  genero: string[];
  duracion_min: number;
  clasificacion: string;
  fecha_estreno: string;
  sinopsis?: string;
  cadenas_ids: string[];
}

export interface ScrapedShowtime {
  id: string;
  pelicula_id: string;
  cadena_id: string;
  fecha: string;   // "YYYY-MM-DD"
  horario: string; // "HH:MM"
  sala: string;
  url_compra: string;
  precio_base: number;
}

export interface ScrapeResult {
  cadena_id: string;
  movies: ScrapedMovie[];
  showtimes: ScrapedShowtime[];
  error?: string;
  scraped_at: string;
}
