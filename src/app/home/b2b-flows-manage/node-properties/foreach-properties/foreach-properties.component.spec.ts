import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForeachPropertiesComponent } from './foreach-properties.component';

describe('ForeachPropertiesComponent', () => {
  let component: ForeachPropertiesComponent;
  let fixture: ComponentFixture<ForeachPropertiesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ForeachPropertiesComponent]
    });
    fixture = TestBed.createComponent(ForeachPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
