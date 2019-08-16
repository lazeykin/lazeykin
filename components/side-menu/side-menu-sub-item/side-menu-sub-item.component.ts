import { UserService } from './../../../../../_services/user.service';
import {Component, Input, OnInit} from '@angular/core';
import { MessengerService } from '../../../../../_services';
import { SocketService } from '../../../../../_services/socket.service';
import { Message } from '../../../../../_models';
@Component({
  selector: 'app-side-menu-sub-item',
  templateUrl: './side-menu-sub-item.component.html',
  styleUrls: ['./side-menu-sub-item.component.sass']
})
export class SideMenuSubItemComponent implements OnInit {
  @Input() title = 'My title';
  @Input() routerLink = null;

  productMessagesCount: number = 0;
  orderMessagesCount: number = 0;
  totalMessagesCount: number = 0;

  constructor(
    private userService: UserService,
    private socketService: SocketService,
    private messengerService: MessengerService) {}

  ngOnInit() {
    if(this.routerLink === 'products' || this.routerLink === 'orders' || this.routerLink === 'all') {
      this.reloadMsgCounters();
      this.socketService.onNewMessage.subscribe((new_msg: Message) => {
        if (new_msg) {
          if (this.userService.getCurrentUser().user.id !== new_msg.sender.id) {
              this.messengerService.getDialogById(this.userService.getCurrentUserToken(), new_msg.dialog_id)
                .subscribe(
                  data => {
                    this.totalMessagesCount++
                    if(data['subject_type'] === 'order') {
                      this.orderMessagesCount++;
                    }
                    else this.productMessagesCount++;
                  }
                )
          }
        }
      })
      this.socketService.onDialogMarkRead.subscribe((dialog_id:number) => {
          if (dialog_id) {
              this.reloadMsgCounters();
          }
      })
    }
  }

  reloadMsgCounters() {
    this.userService.getMe(this.userService.getCurrentUserToken()).subscribe(
      (user_info:any) => {
          if(user_info) {
            this.productMessagesCount = user_info.notifications.unread_product_messages_count;
            this.orderMessagesCount = user_info.notifications.unread_order_messages_count;
            this.totalMessagesCount = user_info.notifications.unread_messages_count;
          }
        }
    )
  }


}
