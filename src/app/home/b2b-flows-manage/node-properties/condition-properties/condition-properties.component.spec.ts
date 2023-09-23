import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionPropertiesComponent } from './condition-properties.component';

describe('ConditionPropertiesComponent', () => {
  let component: ConditionPropertiesComponent;
  let fixture: ComponentFixture<ConditionPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConditionPropertiesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConditionPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
