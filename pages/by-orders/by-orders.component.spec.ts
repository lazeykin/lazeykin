import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ByOrdersComponent } from './by-orders.component';

describe('ByOrdersComponent', () => {
  let component: ByOrdersComponent;
  let fixture: ComponentFixture<ByOrdersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ByOrdersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ByOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
