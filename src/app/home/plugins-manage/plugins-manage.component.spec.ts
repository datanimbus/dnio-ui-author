import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginsManageComponent } from './plugins-manage.component';

describe('PluginsManageComponent', () => {
  let component: PluginsManageComponent;
  let fixture: ComponentFixture<PluginsManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PluginsManageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PluginsManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
