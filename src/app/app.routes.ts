import { Routes } from '@angular/router';
import { PokemonListComponent } from './pokedex/list/pokemon-list.component';
import { PokemonDetailComponent } from './pokedex/detail/pokemon-detail.component';

export const routes: Routes = [
  { path: 'pokedex', component: PokemonListComponent },
  { path: 'pokedex/detail', component: PokemonDetailComponent },
  { path: '', redirectTo: '/pokedex', pathMatch: 'full' },
  { path: '**', redirectTo: '/pokedex', pathMatch: 'full' },
];
