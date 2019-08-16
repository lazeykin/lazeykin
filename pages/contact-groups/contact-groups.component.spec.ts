import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactGroupsComponent } from './contact-groups.component';

describe('ContactGroupsComponent', () => {
  let component: ContactGroupsComponent;
  let fixture: ComponentFixture<ContactGroupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactGroupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
