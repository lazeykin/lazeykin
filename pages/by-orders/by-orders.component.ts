import { OrdersService } from './../../../../_services/orders.service';
import { ModalService } from './../../../../_services/modal.service';
import { LanguageService } from './../../../../_services/language.service';
import { TranslatePipe } from './../../../../pipes/translate.pipe';
import { subscribeOn } from 'rxjs/operators';
import {Component, OnInit, ViewChild} from '@angular/core';
import {Dialog, getMessageText, Message} from "../../../../_models";
import {MessengerService, ProductsService, UserService} from "../../../../_services";
import {isString} from "util";
import {PaginationChangedEvent} from "../../../../events";
import {SocketService} from "../../../../_services/socket.service";
import {ActivatedRoute, Router} from "@angular/router";
import {PaginationComponent} from "../../components/pagination/pagination.component";

@Component({
  selector: 'app-by-orders',
  templateUrl: './by-orders.component.html',
  styleUrls: ['./by-orders.component.sass'],
})
export class ByOrdersComponent implements OnInit {
    searchText = ''
    
    isLoading = true
    message = ''
    dialogs: Array<Dialog> = []
    @ViewChild(PaginationComponent) pagination

    statusFilter: string = ''
    selectItems: any = [];
    selectItem: any = [];
    displayAccept: boolean = false;
    displayDecline: boolean = false;
    displayArchive: boolean = false;
    displayUnarchive: boolean = false;
    displayOrderPanel: boolean = false;

    selectedOrderType: string = '';

    isOfferLoading: boolean = false;
    multipleOffers: boolean = false;
    modalOfferId: any;

    orderType = [
        {id: 0, name: 'SORTBY_NEWER_MESSAGES', value: '-last_message__date_created'},
        {id: 1, name: 'SORTBY_OLDER_MESSAGES', value: 'last_message__date_created'},
        {id: 2, name: 'SORTBY_NEWER_DIALOGS', value: '-date_created'},
        {id: 3, name: 'SORTBY_OLDER_DIALOGS', value: 'date_created'},
        {id: 4, name: 'SORTBY_ORDER_ID_MINUS', value: '-order_id'},
        {id: 5, name: 'SORTBY_ORDER_ID_PLUS', value: 'order_id'}
    ]

    orderTypeTranslated: any;

    filterType = [
        {id: 0, name: 'FILTER_ALL', value: null},
        {id: 1, name: 'FILTER_NOT_ARCHIVED', value: false},
        {id: 2, name: 'FILTER_ARCHIVED', value: true}
    ]

    filterTypeTranslated: any;

    orderArray: any = []
    archivedFilter: boolean = null;
    items: any = [];
    Object = Object;

    constructor(
        private messengerService: MessengerService,
        private userService: UserService,
        private productsService: ProductsService,
        private socketService: SocketService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private route: ActivatedRoute,
        private translatePipe: TranslatePipe,
        private langService: LanguageService,
        private modalService: ModalService,
        private orderService: OrdersService
    ) {
        this.getMessageText = getMessageText
    }

    translateValues() {
        this.filterTypeTranslated = this.filterType.map(x => Object.assign({}, x)).map(e => {
            e.name = this.translatePipe.transform(e.name);
            return e;
        })
        this.orderTypeTranslated = this.orderType.map(x => Object.assign({}, x)).map(e => {
            e.name = this.translatePipe.transform(e.name);
            return e;
        })

        if(this.filterTypeTranslated.some(e => {return e.name == undefined}) || this.orderTypeTranslated.some(e => {return e.name === undefined})) {
            setTimeout(this.translateValues.bind(this), 500);
        }
    }
    
    getMessageText(msg: Message) {
      return getMessageText(msg)
    }
    
    formatDate(date:any) {
      if (isString(date)) {
        date = new Date(date)
      }
      return date.toLocaleDateString()
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
    
    getOrderPersonalStatus(order){
        let user = this.userService.getCurrentUser()
        if (user.scope.indexOf('seller') >= 0) {
            return order.seller_confirm_status
        } else {
            return order.buyer_confirm_status
        }
    }
    
    onAcceptOrderClicked(){
        this.isOfferLoading = true;
        // nothing to do, update will be triggered by system message
        this.productsService.acceptOrder(this.userService.getCurrentUserToken(), this.modalOfferId.order.id)
            .subscribe(_ => {
                this.isOfferLoading = false;
                this.router.navigate([`/dashboard/messenger/orders/dialog/${this.modalOfferId.id}`]);
                }, _ => this.isOfferLoading = false
            )
        //this.loadContacts();
        this.closeModal('confirm-accept');
    }
    
    onDeclineOrderClicked(){
        this.isOfferLoading = true;
        // nothing to do, update will be triggered by system message
        this.productsService.declineOrder(this.userService.getCurrentUserToken(), this.modalOfferId.order.id)
            .subscribe(_ => {
                this.isOfferLoading = false;
                this.router.navigate([`/dashboard/messenger/orders/dialog/${this.modalOfferId.id}`])
            }, _ => this.isOfferLoading = false
        )
        // this.loadContacts();
        this.closeModal('confirm-decline');
    }

    onUnarchiveOrderClicked(order_id, event) {
        event.stopPropagation();
        this.productsService.unarchiveOrder(this.userService.getCurrentUserToken(), order_id)
            .subscribe(_ => {})
        this.loadContacts();
    }

    onArchiveOrderClicked() {
        // event.stopPropagation();
        this.isOfferLoading = true;
        this.productsService.archiveOrder(this.userService.getCurrentUserToken(), this.modalOfferId.order.id)
            .subscribe(_ => {
                this.isOfferLoading = false;
                //this.router.navigate([`/dashboard/messenger/orders/dialog/${this.modalOfferId.id}`])
            }, _ => this.isOfferLoading = false
        )
        this.loadContacts();
        this.closeModal('confirm-archive');
        this.modalOfferId = null;
    }
    
    getOrderTotalPairs(order, i?) {
        let sum = 0
        for (let item of order.items) {
            if (item.size_quantities) {
                order.items.length > 1 ? this.items[i] = null :  this.items[i] = item.size_quantities;
                for (let key in item.size_quantities) {
                    if (item.size_quantities.hasOwnProperty(key)) {
                        sum += parseInt(item.size_quantities[key], 10)
                    }
                }
            } else {
                // todo: display more then one prepacks
                order.items.length > 1 ? this.items[i] = null :   this.items[i] = item.prepack.sizes;
                let prepack_pairs = 0
                for (let key in item.prepack.sizes) {
                    if (item.prepack.sizes.hasOwnProperty(key)) {
                        prepack_pairs += parseInt(item.prepack.sizes[key], 10)
                    }
                }
                sum += prepack_pairs * item.quantity
            }
        }
        return sum
    }
    
    getOrderTotalDiscount(order) {
        if(order.total_price === order.total_price_with_discount)
            return 
        let discount = 100 - (order.total_price_with_discount * 100 / order.total_price);
        return discount;
    }

    getOrderTotalSizes(order){
        let sizes = []
        for (let item of order.items) {
            if (item.size_quantities) {
                for (let key in item.size_quantities) {
                    if (item.size_quantities.hasOwnProperty(key)) {
                        sizes.push(key)
                    }
                }
            } else {
                let prepack_pairs = 0
                for (let key in item.prepack.sizes) {
                    if (item.prepack.sizes.hasOwnProperty(key)) {
                        sizes.push(key)
                    }
                }
            }
        }
        let set = new Set(sizes);
        return set.size
    }
    
    getOrderStatusAsClass(order) {
      switch (parseInt(order.summary_status)) {
          case 0:
              return 'open'
          case 1:
              return 'approved'
          case 2:
              return 'declined'
      }
    }

    getOrderStatusAsText(order) {
            switch (order.summary_status) {
                case 0:
                    return this.translatePipe.transform('STATUS_OPEN')
                case 1:
                    return this.translatePipe.transform('STATUS_APPROVED')
                case 2:
                    return this.translatePipe.transform('STATUS_DECLINED')
            }
        }
    
    archiveOrders() {
        this.modalOfferId = null;
        this.isOfferLoading = true;
        let batchArr = [];
        for (let i = 0; i < this.selectItems.length; i++) {
            batchArr.push({
                "method": "POST",
                "path": `/api/v1/orders/${this.selectItems[i].id}/archive/`
            })
        }

        this.productsService.batch(this.userService.getCurrentUserToken(), {"operations": batchArr})
            .subscribe(_ => {
                this.loadContacts();
                this.clearSelection();
                this.isOfferLoading = false;
                this.closeModal('confirm-archive');
            }, _ => {
                this.isOfferLoading = false;
                this.closeModal('confirm-archive');
            })
    }

    acceptOrders() {
        this.modalOfferId = null;
        this.isOfferLoading = true;
        let batchArr = [];
        for (let i = 0; i < this.selectItems.length; i++) {
            batchArr.push({
                "method": "POST",
                "path": `/api/v1/orders/${this.selectItems[i].id}/approve/`
            })
        }
        this.productsService.batch(this.userService.getCurrentUserToken(), {"operations": batchArr})
            .subscribe(_ => {
                this.loadContacts();
                this.clearSelection();
                this.isOfferLoading = false;
                this.closeModal('confirm-accept');
            }, _ => {
                this.isOfferLoading = false;
                this.closeModal('confirm-accept');
            })
    }

    declineOrders() {
        this.modalOfferId = null;
        this.isOfferLoading = true;
        let batchArr = [];
        for (let i = 0; i < this.selectItems.length; i++) {
            batchArr.push({
                "method": "POST",
                "path": `/api/v1/orders/${this.selectItems[i].id}/decline/`
            })
        }
        this.productsService.batch(this.userService.getCurrentUserToken(), {"operations": batchArr})
            .subscribe(_ => {
                this.loadContacts();
                this.clearSelection();
                this.isOfferLoading = false;
                this.closeModal('confirm-decline');
            }, _ => {
                this.isOfferLoading = false;
                this.closeModal('confirm-decline');
            })
    }

    unarchiveOrders() {
        let batchArr = [];
        for (let i = 0; i < this.selectItems.length; i++) {
            batchArr.push({
                "method": "DELETE",
                "path": `/api/v1/orders/${this.selectItems[i].id}/archive/`
            })
        }
        this.productsService.batch(this.userService.getCurrentUserToken(), {"operations": batchArr})
            .subscribe(_ => {
                this.loadContacts();
                this.clearSelection();
            })
    }

    openModal(event, id, dialog_id?) {
        event.stopPropagation();
        if(dialog_id) {
            this.multipleOffers = false;
            this.modalOfferId = dialog_id;
        } else this.multipleOffers = true;

        this.modalService.open(id);
    }

    closeModal(id) {
        this.modalService.close(id);
    }


    getDialogLink(dialog:Dialog) {
      return ['/dashboard/messenger/orders/dialog', dialog.id]
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
            'subject_type': 'order',
            [filter.toLowerCase()]: true,
            'ordering': this.selectedOrderType,
            'archived': this.archivedFilter,
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
        console.log('INFO: ', info)
        this.clearSelection();
        this.loadContacts(this.searchText, info.fetch, info.offset)
    }
    
    onClearFiltersClick() {
        this.searchText = ''
        this.loadContacts(null)
    }
    
    onSearchClick() {
        this.loadContacts(this.searchText)
    }

    addItemsOrder(event, item, itemNumber) {
        //event.stopPropagation();
        console.log(event, item, itemNumber)
        this.selectItem[itemNumber] = event;
        let even = function(element) {
            return element === true;
        };
        if (event) {
            this.selectItems.push(item);
        } else {
            for (let i=0; i < this.selectItems.length; i++) {
                console.log(this.selectItems[i], item)
                if (this.selectItems[i] === item) {
                    this.selectItems.splice(i, 1);
                }
            }
        }
        if(this.selectItems.length)
            this.displayOrderPanel = true;
        else 
            this.displayOrderPanel = false;
        console.log(this.selectItems);
        this.displayAccept = this.selectItems.every(e => this.getOrderPersonalStatus(e) === 0)
        this.displayDecline = this.selectItems.every(e => this.getOrderPersonalStatus(e) === 0)
        this.displayArchive = this.selectItems.every(e => !e.is_archived && e.summary_status > 0)
        this.displayUnarchive = this.selectItems.every(e => e.is_archived)
    }

    clearSelection() {
        for (let i=0; i < this.selectItem.length; i++ ){
            this.selectItem[i] = false;
        }
        this.displayOrderPanel = false;
        this.selectItems = [];
    }

    onEditOrderClicked(order_id, event) {
        event.stopPropagation();
        this.router.navigate([`/dashboard/messenger/orders/dialog/${order_id}`, {data: 'orderEdit'}])
    }
    onStatusFilter(event) {
        console.log(event)
        this.statusFilter = event;
        this.loadContacts();
    }

    onOrderFilter(event) {
        this.selectedOrderType = event.value;
        console.log(this.selectedOrderType)
        this.loadContacts();
    }

    onArchiveFilter(event) {
        this.archivedFilter = event.value;
        this.loadContacts();
    }

    selectOrder(type: string) {
        this.selectedOrderType = type;
        this.pagination.goToFirstPage();
        this.loadContacts();
    }

    rateOrder(id: number, rating: number, e: Event) {
        e.stopPropagation();
        this.orderService.rateOrder(this.userService.getCurrentUserToken(), id, rating)
            .subscribe((data : any) => {
                this.loadContacts();
            })
    }

    getRating(dialog: Dialog) {
        let role = this.userService.getCurrentUser().scope[0];
        return dialog.users.find(e => {
            return e.reg_type !== role
        })['average_rating'];
    }

}
