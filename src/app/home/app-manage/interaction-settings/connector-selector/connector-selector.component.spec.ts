import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectorSelectorComponent } from './connector-selector.component';

describe('ConnectorSelectorComponent', () => {
  let component: ConnectorSelectorComponent;
  let fixture: ComponentFixture<ConnectorSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectorSelectorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectorSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
