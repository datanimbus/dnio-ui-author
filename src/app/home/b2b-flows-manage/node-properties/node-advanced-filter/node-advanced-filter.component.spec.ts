import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeAdvancedFilterComponent } from './node-advanced-filter.component';

describe('NodeAdvancedFilterComponent', () => {
  let component: NodeAdvancedFilterComponent;
  let fixture: ComponentFixture<NodeAdvancedFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeAdvancedFilterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeAdvancedFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
