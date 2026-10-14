export interface PokemonTypeRef {
  slot: number;
  type: { name: string; url: string };
}

export interface PokemonStat {
  base_stat: number;
  stat: { name: string; url: string };
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny?: string | null;
}

export interface Pokemon {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  types: PokemonTypeRef[];
  sprites: PokemonSprites;
  stats?: PokemonStat[];
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: { name: string; url: string }[];
}
