import { ModalService } from './../../../../_services/modal.service';
import { LanguageService } from './../../../../_services/language.service';
import { ProductsService } from './../../../../_services/products.service';
import { PaginationComponent } from './../../components/pagination/pagination.component';
import { PaginationChangedEvent } from './../../../../events/index';
import { ActivatedRoute, Router } from '@angular/router';
import { MessengerService } from './../../../../_services/messenger.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Dialog, Message, getMessageText } from '../../../../_models';
import { SocketService } from '../../../../_services/socket.service';
import { UserService, OrdersService } from '../../../../_services';
import { isString } from 'util';
import { timingSafeEqual } from 'crypto';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
    selector: 'app-by-all',
    templateUrl: './by-all.component.html',
    styleUrls: ['./by-all.component.sass']
})
export class ByAllComponent implements OnInit {
    constructor(
        private messengerService: MessengerService,
        private userService: UserService,
        private socketService: SocketService,
        private activatedRoute: ActivatedRoute,
        private productsService: ProductsService,
        private router: Router,
        private langService: LanguageService,
        private translatePipe: TranslatePipe,
        private modalService: ModalService,
        private orderService: OrdersService
    ) {
        this.getMessageText = getMessageText
     }

    @ViewChild(PaginationComponent) pagination
    searchText = ''

    isLoading = true
    message = ''
    dialogs: Array<Dialog> = []
    statusFilter: string = ''

    productHeadElem: JQuery;
    orderHeadElem: JQuery;

    searchType = [
        {id: 0, name: 'FILTER_ALL'},
        {id: 1, name: 'FILTER_ORDER'},
        {id: 2, name: "FILTER_PRODUCT"}
    ]

    searchTypeTranslated: any;
    selectedSearchType: string = ''
    selectItems: any = [];
    selectItem: any = [];
    displayAccept: boolean = false;
    displayDecline: boolean = false;
    displayArchive: boolean = false;
    displayUnarchive: boolean = false;
    displayOrderPanel: boolean = false;

    productHead = ['', 'TABLE_PRODUCT', '', 'TABLE_CONTACT', 'TABLE_MESSAGE', '', '', 'TABLE_DATE'];
    orderHead = ['', 'TABLE_ORDER_ID', 'TABLE_STATUS', 'TABLE_CONTACT', 'TABLE_PRODUCTS', 'TABLE_PAIRS_SIZES', 'TABLE_TOTAL_COST', '']


    productHeadTranslated: any;
    orderHeadTranslated: any;

    isOfferLoading: boolean = false;
    multipleOffers: boolean = false;
    modalOfferId: any;

    getMessageText(msg: Message) {
        return getMessageText(msg)
    }

    translateValues() {
        this.productHeadTranslated = this.productHead.map(e => {
            return this.translatePipe.transform(e);
        })

        this.searchTypeTranslated = this.searchType.map(x => Object.assign({}, x)).map(e => {
            e.name = this.translatePipe.transform(e.name);
            return e;
        })

        this.orderHeadTranslated = this.orderHead.map(e => {
            return this.translatePipe.transform(e);
        })

        console.log(this.productHeadTranslated)
        if( this.productHeadTranslated.some(e => {return e === undefined}) ||
            this.searchTypeTranslated.some(e => {return e === undefined}) ||
            this.orderHeadTranslated.some(e => {return e === undefined})) {
            setTimeout(this.translateValues.bind(this), 500);
        }
        else {
            this.createHeadElements();
        }

    }
    
    onViewOrderClicked() {}
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
            });
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


    getProductLink(dialog: Dialog) {
        const auth_user = this.userService.getCurrentUser()
        if (auth_user.scope.indexOf('seller') >= 0) {
          return ['/dashboard/seller/product/', dialog.product.id]
        }
        return ['/dashboard/buyer/product/', dialog.product.id]
        
    }
    
    getOrderPersonalStatus(order){
        let user = this.userService.getCurrentUser()
        if (user.scope.indexOf('seller') >= 0) {
            return order.seller_confirm_status
        } else {
            return order.buyer_confirm_status
        }
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
    
    getOrderTotalPairs(order){
        let sum = 1
        for (let item of order.items) {
            if (item.size_quantities) {
                for (let key in item.size_quantities) {
                    if (item.size_quantities.hasOwnProperty(key)) {
                        sum += parseInt(item.size_quantities[key], 10)
                    }
                }
            } else {
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

    formatDate(date:any) {
        if (isString(date)) {
          date = new Date(date)
        }
        return date.toLocaleDateString()
      }
    
    getOrderStatusAsClass(dialog) {
        if(dialog.subject_type === 'order') {
            switch (parseInt(dialog.order.summary_status)) {
                case 0:
                    return 'open'
                case 1:
                    return 'approved'
                case 2:
                    return 'declined'
            }
        }
    }

    getOrderStatusAsText(dialog) {
        if(dialog.subject_type === 'order') {
            switch (parseInt(dialog.order.summary_status)) {
                case 0:
                    return this.translatePipe.transform('STATUS_OPEN')
                case 1:
                    return this.translatePipe.transform('STATUS_APPROVED')
                case 2:
                    return this.translatePipe.transform('STATUS_DECLINED')
            }
        }
    }


    stopProp(event) {
        if(event.stopPropagation)
            event.stopPropagation();
    }
    onAcceptOrderClicked(){
        // event.stopPropagation();
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
        // event.stopPropagation();
        this.isOfferLoading = true;
        // nothing to do, update will be triggered by system message
        this.productsService.declineOrder(this.userService.getCurrentUserToken(), this.modalOfferId.order.id)
            .subscribe(_ => {
                this.isOfferLoading = false;
                this.router.navigate([`/dashboard/messenger/orders/dialog/${this.modalOfferId.id}`]);
                }, _ => this.isOfferLoading = false
            )
        //this.loadContacts();
        this.closeModal('confirm-decline');
    }

    onArchiveOrderClicked() {
        // event.stopPropagation();
        this.isOfferLoading = true;
        this.productsService.archiveOrder(this.userService.getCurrentUserToken(), this.modalOfferId.order.id)
            .subscribe(_ => this.isOfferLoading = false, _ => this.isOfferLoading = false)
        this.loadContacts();
        this.closeModal('confirm-archive');
        this.modalOfferId = null;
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
    onUnarchiveOrderClicked(order_id, event) {
        event.stopPropagation();
        this.productsService.unarchiveOrder(this.userService.getCurrentUserToken(), order_id)
            .subscribe(_ => {})
        this.loadContacts();
    }

    onEditOrderClicked(order_id, event) {
        event.stopPropagation();
        this.router.navigate([`/dashboard/orders/${order_id}`])
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
        let type = this.selectedSearchType;
        this.messengerService.getDialogs(this.userService.getCurrentUserToken(), {
            'search': this.searchText,
            'limit': limit,
            'offset': offset,
             [filter.toLowerCase()]: true,
             'subject_type': type.toLowerCase()
        }).subscribe(
            response => {
                console.log(`Got response for search=${search}`)
                this.message = ''
                this.pagination.totalRows = response.count
                if (response.count === 0) {
                    this.message = 'No dialogs found.'
                    this.isLoading = false
                } else {
                    this.dialogs = response.results
                    // delete dialog without contact
                    for (let i = 0; i < this.dialogs.length; i++) {
                        if (this.dialogs[i].users.length < 2) {
                            console.log(this.dialogs[i])
                            this.dialogs.splice(i, 1);
                        }
                    }
                    this.isLoading = false
                }
                console.log(this.dialogs);
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
        this.langService.currentLanguage.subscribe(lang => {
            setTimeout(this.translateValues.bind(this), 2000);
        })
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
    }
    
    createHeadElements() {
        //table styling 
        let style = {
            'font-size': '12px',
            'color': '#b8bfd3',
            'text-transform': 'uppercase',
            'padding': '20px 0 14px 0'
        }
        this.productHeadElem = $(document.createElement('tr'));
        this.productHeadElem.addClass('product head');
        for(let i = 0; i < this.productHeadTranslated.length; i++) {
            let item = $(document.createElement('th'));
            if(i == 0) {
                item.css({'width': '60px'})
            }
            if(i == 1) {
                item.css({'width': '100px'})
            }
            item.text(this.productHeadTranslated[i]);
            item.css(style);
            this.productHeadElem.append(item);
        }

        this.orderHeadElem = $(document.createElement('tr'));
        this.orderHeadElem.addClass('order head');
        for(let i = 0; i < this.orderHeadTranslated.length; i++) {
            let item = $(document.createElement('th'));
            if(i == 0) {
                item.css({'width': '60px'})
            }
            if(i == 1) {
                item.css({'width': '100px'})
            }
            item.text(this.orderHeadTranslated[i]);
            item.css(style);
            this.orderHeadElem.append(item);
        }

        this.productHeadElem.css({
            'height': '20px',
            'cursor': 'pointer'
        })

        this.orderHeadElem.css({
            'height': '20px', 
            'cursor': 'pointer'
        })
    }
    onPageChanged(info:PaginationChangedEvent) {
        console.log('onPageChanged');
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

    onStatusFilter(event) {
        console.log(event)
        this.statusFilter = event;
        this.loadContacts();
    }

    onTypeFilter(event) {
        this.selectedSearchType = event.name;
        console.log(this.selectedSearchType)
        this.loadContacts();
    }

    prependHead(index, item) {
        if(this.orderHeadElem && this.productHead) {
            let elem = $(`tr[data-value='${item.id}'`);
            if(item.product && this.dialogs[index+1] && this.dialogs[index+1].product || 
                item.order && this.dialogs[index+1] && this.dialogs[index+1].order) {
                elem.css({
                    'border-bottom': '1px solid #edeff4'
                })
            }
            if((item.product && index > 0 && this.dialogs[index-1].order) || (item.product && index === 0)) {
                if(!$(elem).prev().hasClass('head')) {
                    elem.before(this.productHeadElem.clone())
                }
            }
            else if((item.order && index > 0 && this.dialogs[index-1].subject_type == 'product') || (item.order && index === 0)) {
                    if(!$(elem).prev().hasClass('head')) {
                        elem.before(this.orderHeadElem.clone());
                    }
            }
        }

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
