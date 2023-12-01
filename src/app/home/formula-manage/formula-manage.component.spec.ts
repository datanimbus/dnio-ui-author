import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulaManageComponent } from './formula-manage.component';

describe('FormulaManageComponent', () => {
  let component: FormulaManageComponent;
  let fixture: ComponentFixture<FormulaManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormulaManageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormulaManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
