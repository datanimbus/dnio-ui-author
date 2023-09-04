import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginsListingComponent } from './plugins-listing.component';

describe('PluginsListingComponent', () => {
  let component: PluginsListingComponent;
  let fixture: ComponentFixture<PluginsListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PluginsListingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PluginsListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
