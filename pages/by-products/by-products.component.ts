import { FormGroup, FormControl } from '@angular/forms';
import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {Contact, Dialog, getMessageText, Message} from '../../../../_models';
import {MessengerService, UserService} from '../../../../_services';
import {PaginationChangedEvent} from '../../../../events';
import {
    BuyerCartComponent,
    BuyerComponent, BuyerMakeOrderComponent, BuyerSingleProductComponent,
    SellerEditComponent, SellerPreviewEditProductComponent, SellerPreviewProductComponent,
    SellerProductAddComponent,
    SellerSingleProductComponent
} from "../../..";
import {AuthGuard} from "../../../../_guards";
import {isString} from "util";
import {SocketService} from "../../../../_services/socket.service";
import {ActivatedRoute, Router} from "@angular/router";
import {PaginationComponent} from "../../components/pagination/pagination.component";
import { LanguageService } from '../../../../_services/language.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-by-products',
  templateUrl: './by-products.component.html',
  styleUrls: ['./by-products.component.sass']
})
export class ByProductsComponent implements OnInit {
    searchText = ''

    isLoading = true
    message = ''
    dialogs: Array<Dialog> = []
    statusFilter: string = ''
    
    messageStatus = [
        {id: 0, name: 'All'},
        {id: 1, name: 'Read'},
        {id: 2, name: "Unread"}
    ]

    selectedOrderType: string = '';

    orderType = [
        {id: 0, name: 'SORTBY_NEWER_MESSAGES', value: '-last_message__date_created'},
        {id: 1, name: 'SORTBY_OLDER_MESSAGES', value: 'last_message__date_created'},
        {id: 2, name: "SORTBY_NEWER_DIALOGS", value: '-date_created'},
        {id: 3, name: 'SORTBY_OLDER_DIALOGS', value: 'date_created'}
    ]

    orderTypeTranslated: any;

    @ViewChild(PaginationComponent) pagination
    
    constructor(
        private messengerService: MessengerService,
        private userService: UserService,
        private socketService: SocketService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private translatePipe: TranslatePipe,
        private langService: LanguageService
    ) {
        this.getMessageText = getMessageText
    }
    

    translateValues() {
        this.orderTypeTranslated = this.orderType.map(x => Object.assign({}, x)).map(e => {
            e.name = this.translatePipe.transform(e.name);
            return e;
        })

        if(this.orderTypeTranslated.some(e => {return e.name === undefined})) {
            setTimeout(this.translateValues.bind(this), 500);
        }
    }

    getMessageText(msg: Message) {
      return getMessageText(msg)
    }
    
    getProductLink(dialog: Dialog) {
        const auth_user = this.userService.getCurrentUser()
        if (auth_user.scope.indexOf('seller') >= 0) {
          return ['/dashboard/seller/product/', dialog.product.id]
        }
        return ['/dashboard/buyer/product/', dialog.product.id]
        
    }
    
    getDialogOtherUser(dialog:Dialog) {
        const auth_user = this.userService.getCurrentUser()
        for (const user of dialog.users) {
             if (user.id !== auth_user.user.id) {
               return user
             }
        }
        return null
    }
    
    getDialogLink(dialog:Dialog) {
      return ['/dashboard/messenger/products/dialog', dialog.id]
    }
    
    loadContacts(search:string='', limit=null, offset=0) {
        if (limit == null) {
            limit = this.pagination.pageSize
        }
        this.isLoading = true
        this.dialogs = [];
        let filter = this.statusFilter;
        this.messengerService.getDialogs(this.userService.getCurrentUserToken(), {
            'search': search,
            'subject_type': 'product',
            'ordering': this.selectedOrderType,
            [filter.toLowerCase()]: true,
            'limit': limit,
            'offset': offset
        }).subscribe(
            response => {
                console.log(`Got response for search=${search}`)
                this.isLoading = false
                this.message = ''
                this.pagination.totalRows = response.count
                if (response.count === 0) {
                    this.message = 'No dialogs found.'
                } else {
                    this.dialogs = response.results
                    // delete dialog without contact
                    for (let i = 0; i < this.dialogs.length; i++) {
                        if (this.dialogs[i].users.length < 2) {
                             console.log(this.dialogs[i])
                            this.dialogs.splice(i, 1);
                        }
                    }
                }
            },
            error => {
                console.log('Error')
                console.log(error)
                this.isLoading = false
                this.message = 'Something goes wrong. Please, refresh the page and try again'
            }
        );
    }
    
    ngOnInit(): void {
        this.statusFilter = 'all';
        this.searchText = this.activatedRoute.snapshot.queryParamMap.get('search')
        this.socketService.onNewMessage.subscribe((new_msg:Message) => {
            if (new_msg) {
                for (let dialog of this.dialogs) {
                    if (dialog.id == new_msg.dialog_id) {
                        this.messengerService.getDialogById(this.userService.getCurrentUserToken(), dialog.id)
                            .subscribe(new_dialog => {
                                const index = this.dialogs.map(function (e) {
                                    return e.id;
                                }).indexOf(new_dialog.id);
                                if (index >= 0) {
                                    this.dialogs[index] = new_dialog
                                } else {
                                }
                            })
                        break
                    }
                }
            }
        })
        this.socketService.onDialogMarkRead.subscribe((dialog_id:number) => {
            if (dialog_id) {
                for (let dialog of this.dialogs) {
                    if (dialog.id == dialog_id) {
                        dialog.unread_messages_count = 0
                        break
                    }
                }
            }
        })

        this.langService.currentLanguage.subscribe(lang => {
            setTimeout(this.translateValues.bind(this), 2000);
        })
    }
    
    onPageChanged(info:PaginationChangedEvent) {
        console.log('onPageChanged')
        this.loadContacts(this.searchText, info.fetch, info.offset)
    }
    
    onClearFiltersClick() {
        this.searchText = ''
        this.loadContacts(null)
    }
    
    onSearchClick() {
        this.loadContacts(this.searchText)
    }

    onStatusFilter(event) {
        this.statusFilter = event;
        this.loadContacts();
    }

    onOrderFilter(event) {
        this.selectedOrderType = event.value;
        this.loadContacts();
    }

}
