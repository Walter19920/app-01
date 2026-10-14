import { Routes } from '@angular/router';
import { PokemonListComponent } from './pokedex/list/pokemon-list.component';
import { PokemonDetailComponent } from './pokedex/detail/pokemon-detail.component';

export const routes: Routes = [
  // La raíz renderiza la lista en vez de redirigir: un `redirectTo` no se
  // prerenderiza, así que GitHub Pages no recibiría ningún `index.html` en "/".
  { path: '', component: PokemonListComponent },
  { path: 'pokedex', component: PokemonListComponent },
  { path: 'pokedex/detail', component: PokemonDetailComponent },
  { path: '**', redirectTo: '/pokedex', pathMatch: 'full' },
];
