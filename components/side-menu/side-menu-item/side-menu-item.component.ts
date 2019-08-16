import {AfterViewInit, Component, ContentChildren, Input, OnInit, ViewChild} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

import {SideMenuSubItemComponent} from '../side-menu-sub-item/side-menu-sub-item.component';


@Component({
  selector: 'app-side-menu-item',
  templateUrl: './side-menu-item.component.html',
  styleUrls: ['./side-menu-item.component.sass']
})
export class SideMenuItemComponent implements OnInit, AfterViewInit {
    @Input() title = 'My title';
    @Input() routerLink = undefined;

    @ViewChild('contentWrapper') contentWrapper;
    @ContentChildren(RouterLink) routes;

    has_children = true;

    @Input() is_expanded = true;

    constructor(
        private cdRef:ChangeDetectorRef,
        private router: Router,
    ) { }

    ngOnInit() {
    }

    onClick() {
        if (this.has_children) {
            this.is_expanded = !this.is_expanded
        }
    }

    checkRoute() {
        return this.router.url === '/dashboard/messenger/groups'
    }
    check_children() {
        this.has_children = this.contentWrapper.nativeElement.childNodes.length !== 0
        // https://stackoverflow.com/a/39787056/5558123
        this.cdRef.detectChanges()
    }

    check_routes() {
        for (const router_link of this.routes.toArray()) {
            const is_active = this.router.isActive(router_link.urlTree, false)
            if (this.has_children && is_active) {
                this.is_expanded = true
                this.cdRef.detectChanges()
                break
            }
        }
    }


    ngAfterViewInit() {
        // https://stackoverflow.com/questions/35107211/in-angular-2-how-to-check-whether-ng-content-is-empty
        this.check_children()
        // listen for updates
        if (this.contentWrapper !== undefined && this.contentWrapper.changes) {
            this.contentWrapper.changes.subscribe(() => {
                this.check_children()
            });
        }
        // check for active sub route
        this.check_routes()
        this.routes.changes.subscribe(() => {
            this.check_routes()
          });
    }

}
