import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PokemonListComponent } from './pokemon-list.component';

const API = 'https://pokeapi.co/api/v2/pokemon';

const LIST_RESPONSE = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { name: 'pikachu', url: `${API}/25/` },
    { name: 'charmander', url: `${API}/4/` },
  ],
};

function detail(id: number, name: string, typeName: string) {
  return {
    id,
    name,
    base_experience: 55,
    height: 4,
    weight: 60,
    types: [{ slot: 1, type: { name: typeName, url: 'https://pokeapi.co/api/v2/type/1/' } }],
    sprites: { front_default: `https://example.com/${id}.png` },
    stats: [],
  };
}

describe('PokemonListComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Ninguna petición debe quedar sin responder (evita llamadas reales a la API).
    httpMock.verify();
  });

  /** Arranca el componente y responde la lista + el detalle de cada pokemon. */
  function loadFixture(): ComponentFixture<PokemonListComponent> {
    const fixture = TestBed.createComponent(PokemonListComponent);
    fixture.detectChanges(); // dispara ngOnInit -> petición de la lista

    httpMock
      .expectOne(
        (req) => req.urlWithParams.startsWith(API) && req.urlWithParams.includes('limit=151'),
      )
      .flush(LIST_RESPONSE);

    httpMock
      .expectOne((req) => req.urlWithParams === `${API}/25`)
      .flush(detail(25, 'pikachu', 'electric'));
    httpMock
      .expectOne((req) => req.urlWithParams === `${API}/4`)
      .flush(detail(4, 'charmander', 'fire'));

    fixture.detectChanges(); // pinta con los datos ya llegados
    return fixture;
  }

  it('loads the catalog and renders every pokemon', () => {
    const fixture = loadFixture();
    const el = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.isLoading()).toBe(false);
    expect(fixture.componentInstance.pokemons().length).toBe(2);
    expect(el.querySelectorAll('.pokemon-card').length).toBe(2);
    expect(el.querySelector('.loading-spinner')).toBeNull();
  });

  it('shows the image and the type badge of each pokemon', () => {
    const fixture = loadFixture();
    const el = fixture.nativeElement as HTMLElement;

    const images = [...el.querySelectorAll('img.card-image')].map((i) => i.getAttribute('src'));
    expect(images).toContain('https://example.com/25.png');

    const badges = [...el.querySelectorAll('.type-badge')].map((b) => b.textContent?.trim());
    expect(badges).toContain('electric');
    expect(badges).toContain('fire');
  });

  it('filters by search term', () => {
    const fixture = loadFixture();
    fixture.componentInstance.searchTerm.set('pika');
    fixture.detectChanges();

    const names = [...fixture.nativeElement.querySelectorAll('.card-name')].map((n) =>
      n.textContent?.trim(),
    );
    expect(names).toEqual(['pikachu']);
  });

  it('filters by type', () => {
    const fixture = loadFixture();
    fixture.componentInstance.selectedType.set('fire');
    fixture.detectChanges();

    const names = [...fixture.nativeElement.querySelectorAll('.card-name')].map((n) =>
      n.textContent?.trim(),
    );
    expect(names).toEqual(['charmander']);
  });

  it('combines search and type filters', () => {
    const fixture = loadFixture();
    fixture.componentInstance.searchTerm.set('pika');
    fixture.componentInstance.selectedType.set('fire');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.pokemon-card').length).toBe(0);
    expect(el.querySelector('.no-results')).toBeTruthy();
  });

  it('shows a message when nothing matches', () => {
    const fixture = loadFixture();
    fixture.componentInstance.searchTerm.set('zzzzz');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.no-results')?.textContent).toContain('No se encontraron Pokémon');
  });
});
