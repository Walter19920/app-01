import { Component, OnInit, Inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { PokemonService } from '../pokedex.service';
import { Pokemon, PokemonTypeRef } from '../pokedex.interface';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.css'],
})
export class PokemonListComponent implements OnInit {
  // La app es zoneless: el estado que se lee en el template DEBE ser una signal
  // para que la carga asíncrona repinte la vista (con propiedades planas la
  // lista se quedaba en "Cargando..." hasta que el usuario tocaba algo).
  pokemons = signal<Pokemon[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  selectedType = signal('all');

  types: string[] = [
    'all',
    'normal',
    'fire',
    'water',
    'grass',
    'electric',
    'ice',
    'fighting',
    'poison',
    'ground',
    'flying',
    'psychic',
    'bug',
    'rock',
    'ghost',
    'dragon',
    'dark',
    'steel',
    'fairy',
  ];

  // El filtrado se deriva de los signals: se recalcula solo cuando cambian.
  filteredPokemons = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const type = this.selectedType();
    let result = this.pokemons();

    if (term) {
      result = result.filter((p) => p.name?.toLowerCase().includes(term));
    }

    if (type !== 'all') {
      result = result.filter(
        (p) => Array.isArray(p.types) && p.types.some((t: PokemonTypeRef) => t.type.name === type),
      );
    }

    return result;
  });

  constructor(
    private pokemonService: PokemonService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    // La lista se carga solo en el navegador: en el servidor (SSR) se evitan
    // 151 peticiones duplicadas y la página responde de inmediato.
    if (isPlatformBrowser(this.platformId)) {
      this.loadPokemons();
    }
  }

  loadPokemons(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.pokemonService.getCatalog(151).subscribe({
      next: (list) => {
        this.pokemons.set(list);
        this.isLoading.set(false);
        if (list.length === 0) {
          this.error.set('No se pudieron cargar los Pokémon');
        }
      },
      error: () => {
        this.error.set('No se pudieron cargar los Pokémon');
        this.isLoading.set(false);
      },
    });
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onTypeSelect(event: Event): void {
    this.selectedType.set((event.target as HTMLSelectElement).value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  viewDetail(pokemon: Pokemon): void {
    this.router.navigate(['/pokedex/detail'], {
      queryParams: { id: pokemon.id },
      state: { pokemon },
    });
  }
}
