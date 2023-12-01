import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSecretsComponent } from './app-secrets.component';

describe('AppSecretsComponent', () => {
  let component: AppSecretsComponent;
  let fixture: ComponentFixture<AppSecretsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppSecretsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppSecretsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
