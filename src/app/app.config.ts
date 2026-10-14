import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Obligatorio para la Pokédex: sin provideHttpClient() el HttpClient no existe
    // y PokemonService falla al inyectarse (por eso no cargaban los Pokémon).
    provideHttpClient(withFetch()),
    // No usar provideClientHydration(): los datos vienen de una API externa, el
    // servidor renderiza "Cargando..." y el cliente arranca igual, por lo que la
    // hidratación solo generaba errores de mismatch en consola.
  ],
};
