import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SideMenuSubItemComponent } from './side-menu-sub-item.component';

describe('SideMenuSubItemComponent', () => {
  let component: SideMenuSubItemComponent;
  let fixture: ComponentFixture<SideMenuSubItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SideMenuSubItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideMenuSubItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
