import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Apollo } from 'apollo-angular';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [ { provide: Apollo, useValue: {} } ] 
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

});