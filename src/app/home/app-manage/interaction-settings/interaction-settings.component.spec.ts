import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionSettingsComponent } from './interaction-settings.component';

describe('InteractionSettingsComponent', () => {
  let component: InteractionSettingsComponent;
  let fixture: ComponentFixture<InteractionSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InteractionSettingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteractionSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
