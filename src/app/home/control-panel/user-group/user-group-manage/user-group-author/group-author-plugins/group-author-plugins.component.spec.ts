import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupAuthorPluginsComponent } from './group-author-plugins.component';

describe('GroupAuthorPluginsComponent', () => {
  let component: GroupAuthorPluginsComponent;
  let fixture: ComponentFixture<GroupAuthorPluginsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupAuthorPluginsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupAuthorPluginsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
