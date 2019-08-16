import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ByProductsComponent } from './by-products.component';

describe('ByProductsComponent', () => {
  let component: ByProductsComponent;
  let fixture: ComponentFixture<ByProductsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ByProductsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ByProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
