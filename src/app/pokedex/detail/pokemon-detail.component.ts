import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PokemonService } from '../pokedex.service';
import { Pokemon } from '../pokedex.interface';

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon-detail.component.html',
  styleUrls: ['./pokemon-detail.component.css'],
})
export class PokemonDetailComponent implements OnInit {
  // Signals: la app es zoneless, así la respuesta asíncrona repinta la vista.
  pokemon = signal<Pokemon | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private pokemonService: PokemonService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // 1) Si venimos de una navegación, usamos el pokemon del state (instantáneo).
    const statePokemon = this.readStatePokemon();

    // 2) El id viene por query param (?id=123): así sobrevive al refresco.
    const id = this.route.snapshot.queryParamMap.get('id');

    if (statePokemon && statePokemon.sprites?.front_default) {
      this.pokemon.set(statePokemon);
      this.loading.set(false);
      // Refresco en segundo plano por si el state venía incompleto.
      this.refreshInBackground(statePokemon.id);
    } else if (id) {
      this.fetchPokemon(id);
    } else if (statePokemon) {
      this.pokemon.set(statePokemon);
      this.loading.set(false);
    } else {
      this.loading.set(false);
      this.error.set('No se recibió ningún Pokémon.');
    }
  }

  private readStatePokemon(): Pokemon | null {
    const nav = this.router.getCurrentNavigation();
    const fromNav = nav?.extras?.state?.['pokemon'] as Pokemon | undefined;
    if (fromNav) {
      return fromNav;
    }
    // Fallback: el state queda en history.state tras la navegación.
    const fromHistory = (typeof history !== 'undefined' && history.state?.pokemon) as
      Pokemon | undefined;
    return fromHistory ?? null;
  }

  private fetchPokemon(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.pokemonService.getPokemonByIdOrName(id).subscribe({
      next: (data) => {
        if (data && data.id) {
          this.pokemon.set(data);
          this.error.set(null);
        } else {
          this.error.set('Pokémon no encontrado.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los detalles.');
        this.loading.set(false);
      },
    });
  }

  private refreshInBackground(id: number): void {
    this.pokemonService.getPokemonByIdOrName(id).subscribe({
      next: (data) => {
        if (data && data.id) {
          this.pokemon.set(data);
        }
      },
      error: () => {
        /* conservamos el state si el refresco falla */
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/pokedex']);
  }
}
