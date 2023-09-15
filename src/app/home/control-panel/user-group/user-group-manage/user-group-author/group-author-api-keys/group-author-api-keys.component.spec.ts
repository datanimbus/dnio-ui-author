import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupAuthorApiKeysComponent } from './group-author-api-keys.component';

describe('GroupAuthorApiKeysComponent', () => {
  let component: GroupAuthorApiKeysComponent;
  let fixture: ComponentFixture<GroupAuthorApiKeysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupAuthorApiKeysComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupAuthorApiKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
