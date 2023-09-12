import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaskingPropertyComponent } from './masking-property.component';

describe('MaskingPropertyComponent', () => {
  let component: MaskingPropertyComponent;
  let fixture: ComponentFixture<MaskingPropertyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MaskingPropertyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaskingPropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
