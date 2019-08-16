import { Component, OnInit } from '@angular/core';
import {MessengerService, UserService} from '../../_services';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.sass']
})
export class MessengerComponent implements OnInit {
    response: any = []
    contactGroups: any = []
  constructor(
      private messengerService: MessengerService,
      private userService: UserService,
      private activatedRoute: ActivatedRoute,
      private router: Router
  ) { }

  ngOnInit() {
      this.messengerService.getContactGroup(this.userService.getCurrentUserToken())
          .subscribe(response => {
              console.log(response)
              this.response = response
              this.contactGroups = this.response.results;

          }, error => {
              console.log('Error')
              console.log(error)
          })
  }

}
