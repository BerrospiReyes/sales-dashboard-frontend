import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Apollo } from 'apollo-angular';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      // Agregamos esto para que la prueba no falle al no encontrar Apollo
      providers: [ { provide: Apollo, useValue: {} } ] 
    }).compileComponents();
  });

  // Esta prueba verifica que el componente cargue, es la única que necesitas ahora
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  // --- LAS OTRAS PRUEBAS SE BORRARON PORQUE USABAN LA VARIABLE 'TITLE' ---
});