import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, forkJoin, switchMap, map, shareReplay } from 'rxjs';
import { Pokemon, PokemonListResponse } from './pokedex.interface';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private apiBase = 'https://pokeapi.co/api/v2';

  // Catálogo completo en memoria: se pide una sola vez y se reutiliza en cada
  // navegación (la app es zoneless y volver a pedir 151 recursos haría lenta
  // la vuelta a la lista).
  private catalog?: Observable<Pokemon[]>;

  constructor(private http: HttpClient) {}

  getPokemonList(limit: number = 20, offset: number = 0): Observable<PokemonListResponse> {
    return this.http
      .get<PokemonListResponse>(`${this.apiBase}/pokemon`, {
        params: { limit: limit.toString(), offset: offset.toString() },
      })
      .pipe(catchError(() => of({ count: 0, next: null, previous: null, results: [] })));
  }

  getPokemonByIdOrName(idOrName: string | number): Observable<Pokemon> {
    return this.http.get<Pokemon>(`${this.apiBase}/pokemon/${idOrName}`).pipe(
      catchError((error) => {
        console.error(`Error fetching Pokémon ${idOrName}`, error);
        // Devolvemos un objeto vacío en lugar de fallar: el template ya
        // tolera sprites undefined mediante la guardia pokemon.sprites?.front_default
        return of({
          id: 0,
          name: '',
          base_experience: 0,
          height: 0,
          weight: 0,
          types: [],
          sprites: { front_default: null },
        } as Pokemon);
      }),
    );
  }

  /**
   * Devuelve los Pokémon con su detalle completo (sprites y tipos) ya cargado.
   * El resultado queda cacheado: la segunda suscripción resuelve instantáneamente.
   */
  getCatalog(limit: number = 151): Observable<Pokemon[]> {
    if (!this.catalog) {
      this.catalog = this.getPokemonList(limit, 0).pipe(
        switchMap((response) => {
          // La lista base solo trae { name, url }; el id sale de la URL.
          const base: Pokemon[] = response.results.map((p, index) => ({
            id: this.extractId(p.url) ?? index + 1,
            name: p.name,
            base_experience: 0,
            height: 0,
            weight: 0,
            types: [],
            sprites: { front_default: null },
          }));

          if (base.length === 0) {
            return of(base);
          }

          const detailRequests: Observable<Pokemon>[] = base.map((p) =>
            this.getPokemonByIdOrName(p.id),
          );

          return forkJoin(detailRequests).pipe(
            map((details) =>
              base.map((p, i) => ({
                ...p,
                ...(details[i] || {}),
                id: p.id, // conservamos el id extraído de la URL
              })),
            ),
          );
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.catalog;
  }

  getPokemonByType(type: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiBase}/type/${type}`)
      .pipe(catchError(() => of({ pokemon: [] })));
  }

  private extractId(url: string): number | null {
    const match = url.match(/\/(\d+)\/?$/);
    return match ? Number(match[1]) : null;
  }
}
