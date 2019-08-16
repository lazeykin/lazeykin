import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {UserService} from '../../../../_services';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.sass']
})
export class SideMenuComponent implements OnInit {
  @Input() groups;
  scope = ''
  constructor(
      private router: Router,
      private userService: UserService
  ) { }

  ngOnInit() {
      this.scope = this.userService.getCurrentUser().scope[0]
  }
    onItemLink() {
        location.reload()
    }
    getGroupLink(e) {
        let str = e.srcElement.childNodes[0].data;
        if (str === ' Groups') {
          this.router.navigate(['dashboard/messenger/groups'])
        }
    }
}
