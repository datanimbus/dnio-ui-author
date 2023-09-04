import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupAuthorFormulasComponent } from './group-author-formulas.component';

describe('GroupAuthorFormulasComponent', () => {
  let component: GroupAuthorFormulasComponent;
  let fixture: ComponentFixture<GroupAuthorFormulasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupAuthorFormulasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupAuthorFormulasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
