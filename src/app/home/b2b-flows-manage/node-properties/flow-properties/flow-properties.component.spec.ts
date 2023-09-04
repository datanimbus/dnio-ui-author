import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowPropertiesComponent } from './flow-properties.component';

describe('FlowPropertiesComponent', () => {
  let component: FlowPropertiesComponent;
  let fixture: ComponentFixture<FlowPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlowPropertiesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlowPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
