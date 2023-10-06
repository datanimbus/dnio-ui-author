import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvVariableConfigComponent } from './env-variable-config.component';

describe('EnvVariableConfigComponent', () => {
  let component: EnvVariableConfigComponent;
  let fixture: ComponentFixture<EnvVariableConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnvVariableConfigComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnvVariableConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
