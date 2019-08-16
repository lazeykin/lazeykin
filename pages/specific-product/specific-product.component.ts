import { TranslatePipe } from './../../../../pipes/translate.pipe';
import { ModalService } from './../../../../_services/modal.service';
import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Dialog, getMessageText, Message} from '../../../../_models';
import {MessengerService, ProductsService, UserService, OrdersService} from '../../../../_services';
import {Contact} from '../../../../_models/contact';
import {isString} from 'util';
import {Observable} from 'rxjs';
import {SocketService} from "../../../../_services/socket.service";

@Component({
    selector: 'app-specific-product',
    templateUrl: './specific-product.component.html',
    styleUrls: ['./specific-product.component.sass']
})
export class SpecificProductComponent implements OnInit {
    isLoading = true
    dialog: Dialog
    messages: Array<Message> = []
    hasNonFetchedMessages = true
    isLoadingMessages = true
    isSendingMessage = false
    hasUnreadMessages = true
    errorMinPrice: any = [];
    showAllOrder: boolean = false;
    isItemEditing: any = [];
    isOrderChanged = false;
    displayErorQuantity: boolean = false;
    displayErorPrepackQuantity: boolean = false;
    displayItemsCountError: boolean = false;
    displayErorDiscount: any = [];
    errorQuantity: any = [];
    errorQuantityMes = false
    biddingPrice: any = [];
    order: any;
    originalOrder: any = null;
    itemNumber: number = null;
    productInfoArray: any = [];
    isHovering: any = [];
    showOrderDetail: boolean = false;
    totalPrice = 0;
    totalPriceDiscount = 0;
    prepackPrice: any;
    prepackAvailableQuantity: any = [];
    newDiscount: any;
    isNanDiscount = false;
    sub: string;
    scope: string;
    dialogId: any;
    @ViewChild('new_message_content') textInputElem
    @ViewChild('message_history_wrapper') messageHistoryElem
    @ViewChild('insideElement') insideElement: any = [];
    @ViewChild('insideModal') insideModal;
    Object = Object;
    pairChange: boolean[] = [];
    priceChange: boolean[] = [];
    scrollTopPosition = 0;
    modalProduct: any = {};
    newPrice: any = [];
    editingItem: any = {};
    viewChange: boolean[] = [];
    isOfferLoading: boolean = false;
    @HostListener('document:click', ['$event.target'])
    public onClick(targetElement) {
        if (this.insideElement) {
            const clickedInside = this.insideElement.nativeElement.contains(targetElement);
            const clickedInsideModal = this.insideModal.nativeElement.contains(targetElement);
            if (clickedInside || clickedInsideModal) {
                console.log('click inside')
            } else {
                this.isItemEditing.splice(this.itemNumber, 1);
                console.log('click outside')
            }
        }
    }
    constructor(
        private messengerService: MessengerService,
        private activeRoute: ActivatedRoute,
        private router: Router,
        private route: ActivatedRoute,
        private userService: UserService,
        private productsService: ProductsService,
        public modalService: ModalService,
        private socketService: SocketService,
        private translatePipe: TranslatePipe,
        private orderService: OrdersService
    ) { }

    getDialogOtherUser(dialog:Dialog):Contact {
        for (const user of dialog.users) {
             if (user.id !== this.userService.getCurrentUser().user.id) {
               return user
             }
        }
        return null
    }
    testString(str: string) {
        return (str.search(/\./) === -1)
    }
    addNewMessage(new_messages:Array<Message>) {
        let is_any_valid = false
        let should_reload = false
        for (let message of new_messages) {
            if (message !== null && message !== undefined && this.dialog && message.dialog_id == this.dialog.id) {
                is_any_valid = true
                this.messages.push(message)
                if (message.type == 'system') {
                    // something happened, reload the dialog
                    should_reload = true
                }
            
            }
        }
        this.messages.sort((a,b) => (a.id > b.id ? 1 : ( a.id < b.id) ? -1 : 0))
        // remove duplicates
        this.messages = this.messages.filter((msg, index, self) =>
          index === self.findIndex((t) => (
            t.id === msg.id
          ))
        )
        if (is_any_valid && this.isScrollInBottomPart()) {
            this.scrollHistoryToBottom()
        }
        if (should_reload && this.dialog) {
            this.loadDialog(this.dialog.id)
        }
    }
    
    isScrollInBottomPart() {
        const elem = this.messageHistoryElem.nativeElement
        let res = (this.scrollTopPosition + elem.offsetHeight + 200 > elem.scrollHeight)
        console.log(`isScrollInBottomPart ${res}, ${this.scrollTopPosition}, ${elem.scrollHeight}, ${elem.height}`)
        return res
    }
    
    getProductLink(dialog: Dialog) {
        if (this.userService.getCurrentUser().scope.indexOf('seller') >= 0) {
          return ['/dashboard/seller/product/', dialog.product.id]
        }
        return ['/dashboard/buyer/product/', dialog.product.id]
    }
    
    scrollHistoryToBottom() {
        setTimeout(_ => {
            // wait for page to render
            const elem = this.messageHistoryElem.nativeElement
            // elem.scrollTo(0, elem.scrollHeight)
            this.scrollTopPosition = elem.scrollHeight
        }, 0)
    }
    
    scrollHistoryToTop() {
        setTimeout(_ => {
            // wait for page to render
            // leave some space
            this.scrollTopPosition = 10
        }, 0)
    }
  
    loadMessages() {
      if (this.hasNonFetchedMessages) {
          this.isLoadingMessages = true
          let last_message_id = null
          if (this.messages.length > 0) {
            last_message_id = this.messages[0].id
          }
          this.messengerService.getDialogMessages(this.userService.getCurrentUserToken(), this.dialog.id, last_message_id).subscribe(
              messages => {
                  console.log('Messages')
                  console.log(messages)
                  if (this.messages.length === 0) {
                      // first read, mark dialog as read
                      console.log('Mark Dialog as Read')
                      this.hasUnreadMessages = false
                      this.messengerService.markDialogAsRead(this.userService.getCurrentUserToken(), this.dialog.id).subscribe(_ => {})
                      // and scroll to bottom to show latest message
                      this.scrollHistoryToBottom()
                  }
                  this.addNewMessage(messages.results)
                  if (messages.count <= 10) {
                      this.hasNonFetchedMessages = false
                  }
                  this.isLoadingMessages = false
              },
              error => {
                  this.isLoadingMessages = false
                  console.log('Error')
                  console.log(error)
              }
          )
      }
    }
    getMsgFilesCount(msg) {
        var arr = msg.split(',');
        return arr;
    }
    getMessageFiles(msg, i) {
        var arr = msg.split(',');
        return arr[i];
    }
    onAcceptOrderClicked(){
        this.isOfferLoading = true;
        // nothing to do, update will be triggered by system message
        this.productsService.acceptOrder(this.userService.getCurrentUserToken(), this.dialog.order.id)
            .subscribe(_ => {
                this.closeConfirmWindow('confirm-accept');
                this.isOfferLoading = false;
            }, _ => this.isOfferLoading = false)
    }
    
    onDeclineOrderClicked(){
        this.isOfferLoading = true;
        // nothing to do, update will be triggered by system message
        this.productsService.declineOrder(this.userService.getCurrentUserToken(), this.dialog.order.id)
            .subscribe(_ => {
                this.closeConfirmWindow('confirm-decline');
                this.isOfferLoading = false;
            }, _ => this.isOfferLoading = false)
    }
    
    getMessageText(msg: Message) {
        let message = getMessageText(msg);
        switch (message) {
            case 'Hello, I want to request the sample of this product.':
                const messageId = 'REQUEST_SAMPLE_MESSAGE'
                return this.translatePipe.transform(messageId) + ' ' + msg.sender.full_name;
        }
        return this.translatePipe.transform(message) + ' ' + msg.sender.full_name;
    }
    
    formatDateToday(date:any) {
        if (isString(date)) {
            date = new Date(date)
        }
        const today = new Date();
        if (date.setHours(0,0,0,0) === new Date().setHours(0,0,0,0)) {
            return 'Today'
        }
        return date.toLocaleDateString()
    }
    
    formatDate(date:any) {
        if (isString(date)) {
            date = new Date(date)
        }
        return date.toLocaleDateString()
    }
    
    getOrderPersonalStatus(order){
        let user = this.userService.getCurrentUser()
        if (user.scope.indexOf('seller') >= 0) {
            return order.seller_confirm_status
        } else {
            return order.buyer_confirm_status
        }
    }
    
    getOrderTotalPairs(order){
        let sum = 0
        for (let item of order.items) {
            if (item.size_quantities) {
                for (let key in item.size_quantities) {
                    if (item.size_quantities.hasOwnProperty(key)) {
                        sum += parseInt(item.size_quantities[key])
                    }
                }
            } else {
                let prepack_pairs = 0
                for (let key in item.prepack.sizes) {
                    if (item.prepack.sizes.hasOwnProperty(key)) {
                        prepack_pairs += parseInt(item.prepack.sizes[key])
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
    
    getOrderStatusAsText(order) {
      switch (parseInt(order.summary_status)) {
          case 0:
              return 'open'
          case 1:
              return 'approved'
          case 2:
              return 'declined'
      }
    }
    
    autosizeTextInput() {
        const ta = this.textInputElem.nativeElement
        setTimeout(() => {
            // wait for page to render
            ta.style.height = '0px'
            const height = Math.min(20 + 15 * 4, ta.scrollHeight)
            ta.style.height = height + 'px'
        }, 0)
        
    }
    
    onFilePicked(files) {
        console.log('onFilePicked')
        const file = files.item(0);
        if (file) {
            this.isSendingMessage = true
            this.messengerService.sendFileMessage(this.userService.getCurrentUserToken(), this.dialog.id, file).subscribe(
                message => {
                    this.isSendingMessage = false
                    this.addNewMessage([message])
                },
                error => {
                    this.isSendingMessage = false
                    alert('Something goes wrong. Could not send your message.')
                });
        }
    }
    
    onCreateMessageClicked() {
        console.log('onCreateMessageClicked')
        const text = this.textInputElem.nativeElement.value;
        if (text) {
            this.isSendingMessage = true
            this.messengerService.sendTextMessage(this.userService.getCurrentUserToken(), this.dialog.id, text).subscribe(
                message => {
                    this.isSendingMessage = false
                    this.textInputElem.nativeElement.value = ''
                    this.addNewMessage([message])
                    this.scrollHistoryToBottom()
                    this.autosizeTextInput();
                    this.textInputElem.nativeElement.disabled = false;
                    this.textInputElem.nativeElement.focus();
                },
                error => {
                    this.isSendingMessage = false
                    alert('Something goes wrong. Could not send your message.')
                });
        }
    }
    
    formatTime(date:any) {
        if (isString(date)) {
            date = new Date(date)
        }
        return date.toLocaleTimeString()
    }
    
    loadDialog(dialog_id) {
        this.messengerService.getDialogById(this.userService.getCurrentUserToken(), dialog_id).subscribe(
            dialog => {
                this.isLoading = false
                console.log(`Got dialog`)
                console.log(dialog)
                this.dialog = dialog;
                if(this.dialog.order) {
                    this.productsService.getOrderInfo(this.userService.getCurrentUserToken(), this.dialog.order.id)
                        .subscribe(response => {
                            this.order = response;
                            console.log(this.order);
                            for (let i=0; i < this.order.items.length; i++) {
                                let item = this.order.items[i]
                                this.order.items[i].product.discount = (100 - (this.order.items[i].
                                    total_price_with_discount/this.order.items[i].total_price)*100).toFixed(0) + "%";
                                console.log('discount: ', item.product.discount);
                                let pairs;
                                if (item.size_quantities) {
                                    pairs =  Object.keys(item.size_quantities).reduce((sum,key) => sum +
                                        parseFloat(item.size_quantities[key] || 0),0);
                                } else if (item.quantity) {
                                    pairs = item.quantity * (Object.keys(item.prepack.sizes).reduce((sum,key) => sum + parseFloat(item.prepack.sizes[key] || 0),0));
                                }

                                if (+item.prev_pairs_count !== 0 && parseFloat(item.prev_pairs_count) !== pairs) {
                                    this.pairChange[i] = true;
                                }
                                this.newPrice[i] = +(item.total_price_with_discount / pairs).toFixed(2);
                                console.log(this.newPrice[i]);
                                console.log((+item.prev_price_pair) !== this.newPrice[i])
                                item.prev_price_pair = (+item.prev_total_price / +item.prev_pairs_count).toFixed(2);
                                console.log((+item.prev_price_pair));
                                if ( +item.prev_price_pair !== 0 && (+item.prev_price_pair) !== this.newPrice[i] && +item.prev_total_price !== 0) {
                                    this.priceChange[i] = true;
                                }
                                console.log(pairs);
                                item.product.price = (+item.product.price).toFixed(2);
                                item.product.minimal_price = (+item.product.minimal_price).toFixed(2);
                                this.biddingPrice[i] = (+item.total_price_with_discount);
                                this.biddingPrice[i] = `${(this.biddingPrice[i] / pairs).toFixed(2)} ${item.product.currency}`;
                                this.newDiscount = parseFloat(this.biddingPrice[i]).toFixed(2);
                                if (item.size_quantities) {
                                    item.size_quantities = Object.entries(this.order.items[i].size_quantities).map(([key, value]) => ({key,value}));
                                    for (let k = 0; k < item.size_quantities.length; k++) {
                                        // todo: change item.size_quantities[k].key depending size type
                                        if (+item.size_quantities[k].key < 15) {
                                            item.size_quantities[k].key = (+item.size_quantities[k].key).toFixed(1);
                                        }
                                    }
                                    let product_sizes = item.product.sizes;
                                    this.productInfoArray.push(product_sizes);
                                    product_sizes = Object.entries(product_sizes).map(([key, value]) => ({key,value}));
                                    for (let j = 0; j < product_sizes.length; j++) {
                                        if (+product_sizes[j].key < 15) {
                                            product_sizes[j].key = (+product_sizes[j].key).toFixed(1);
                                        }
                                        if (!item.size_quantities.find(k => k.key === product_sizes[j].key)) {
                                            item.size_quantities.push({key: product_sizes[j].key, value: null});
                                        }
                                    }
                                    item.size_quantities.sort(function (a, b) { return a.key-b.key; });
                                    if (item.prev_size_quantity) {
                                        item.prev_size_quantity = Object.entries(this.order.items[i].prev_size_quantity).map(([key, value]) => ({key,value}));
                                        for (let k = 0; k < item.prev_size_quantity.length; k++) {
                                            // todo: change item.size_quantities[k].key depending size type
                                            if (+item.prev_size_quantity[k].key < 15) {
                                                item.prev_size_quantity[k].key = (+item.prev_size_quantity[k].key).toFixed(1);
                                            }
                                        }
                                        for (let j = 0; j < product_sizes.length; j++) {
                                            if (!item.prev_size_quantity.find(k => k.key === product_sizes[j].key)) {
                                                item.prev_size_quantity.push({key: product_sizes[j].key});
                                            }
                                        }
                                        item.prev_size_quantity.sort(function (a, b) { return a.key-b.key; });
                                    }

                                } else if (item.quantity) {
                                    this.prepackAvailableQuantity[item.id] = item.product.prepacks[0].available_quantity;
                                        this.prepackPrice = item.total_price / item.quantity;
                                        this.productInfoArray.push(null);
                                        const ordered = {};
                                    for (let key in item.prepack.sizes) {
                                        if (+key < 15 && this.testString(key)) {
                                            item.prepack.sizes =
                                                Object.defineProperty(item.prepack.sizes, Number(key).toFixed(1),
                                                    Object.getOwnPropertyDescriptor(item.prepack.sizes, key))
                                            delete item.prepack.sizes[key]
                                        }
                                    }
                                        Object.keys(item.prepack.sizes).sort(function (a, b) {
                                            return +a - +b; }).forEach((key) => {
                                            ordered[key] = item.prepack.sizes[key];
                                        });
                                        item.prepack.sizes = ordered;
                                }
                            }
                            console.log(this.pairChange);
                            console.log(this.priceChange);
                            console.log(this.order);
                            console.log('product info: ', this.productInfoArray);
                            this.originalOrder = JSON.parse(JSON.stringify(this.order))
                        });
                    }
                this.loadMessages()
            },
            error => {
                console.log('Error')
                console.log(error)
                this.isLoading = false
                if (error.status === 404) {
                  this.router.navigate(['/dashboard/messenger'])
                }
            }
        );
    }
    ngOnInit() {
        this.scope = this.userService.getCurrentUser().user['reg_type'];
        this.sub = this.route.snapshot.paramMap.get('data');
        if (this.sub === 'orderEdit') {
            this.showOrderDetail = true;
        }
        console.log('SpecificProductComponent ngOnInit')
        const dialog_id = this.activeRoute.snapshot.paramMap.get('dialog_id')
        this.dialogId = dialog_id;
        this.loadDialog(dialog_id)
        this.socketService.onNewMessage.subscribe(new_msg => {
            console.log('Got new message in dialog')
            console.log(new_msg)
            this.addNewMessage([new_msg])
            this.hasUnreadMessages = true
        })
    }

    
    onHistoryScroll(event: any) {
        this.scrollTopPosition = event.target.scrollTop;
        console.log(`onHistoryScroll ${this.scrollTopPosition}`)
        if (this.scrollTopPosition === 0 && this.hasNonFetchedMessages) {
            console.log('Loading new messages')
            this.loadMessages()
        }
        // if scrolled to bottom - mark as read
        if (this.isScrollInBottomPart() && !this.isLoading && this.dialog) {
            if (this.hasUnreadMessages) {
                console.log('Mark as read due to scroll')
                this.messengerService.markDialogAsRead(this.userService.getCurrentUserToken(), this.dialog.id)
                    .subscribe(_ => {})
                this.hasUnreadMessages = false
            }
        }
    }

    onEnterPressed(e) {
        if (e.keyCode == 13 && !e.shiftKey) {
            this.onCreateMessageClicked();
        }
        else if (e.keyCode == 13 && e.shiftKey) {
            e.stopPropagation();
        }
    }

    goToProductPage(id) {
        let scope = this.userService.getCurrentUser().user['reg_type']
        this.router.navigate([`dashboard/${scope}/product/${id}`])
    }

    checkItemsEditing() {
        return Object.keys(this.isItemEditing)
                .map(key => this.isItemEditing[key])
                .some(e => e === true);
    }

    isEditing() {
        let is_editing = false
        for (let ie of this.isItemEditing) {
            is_editing = is_editing || ie
        }
        return is_editing
    }

    removeItem(item, itemNumber) {
        console.log(this.dialog.order);
        if(this.dialog.order.items.length === 1) {
            this.displayItemsCountError = true;
            return;
        }
        item.delete = true;
        this.dialog.order.items = this.dialog.order.items.filter(function(obj) {
            return obj.id !== item.id;
        });
        this.isOrderChanged = true;
        console.log(this.dialog.order);
        this.applyOrderChanges();
    }

    getItemTotalPairs(item){
        let sum = 0
        if (item.size_quantities) {
            for (let key in item.size_quantities) {
                if (item.size_quantities.hasOwnProperty(key)) {
                    if(item.size_quantities[key].value) {
                        sum += parseInt(item.size_quantities[key].value)
                    }
                }
            }
        } else {
            let prepack_pairs = 0
            for (let key in item.prepack.sizes) {
                if (item.prepack.sizes.hasOwnProperty(key)) {
                    prepack_pairs += parseInt(item.prepack.sizes[key])
                }
            }
            sum += prepack_pairs * item.quantity
        }
        return sum;
    }
    getChangedItemTotalPairs(item) {
        let sum = 0
        if (item.size_quantities) {
            sum = parseFloat(item.prev_pairs_count);
        } else {
            let prepack_pairs = 0
            for (let key in item.prepack.sizes) {
                if (item.prepack.sizes.hasOwnProperty(key)) {
                    prepack_pairs += parseInt(item.prepack.sizes[key])
                }
            }
            sum += prepack_pairs * item.quantity
        }
        return sum;

    }
    getItemTotalSizes(item){
        let sizes = []
        if (item.size_quantities) {
            for (let key in item.size_quantities) {
                if (item.size_quantities.hasOwnProperty(key)) {
                    if(item.size_quantities[key].value)
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
        let set = new Set(sizes);
        return set.size
    }
    getChangedItemTotalSizes(item) {
        let sizes = 0;
        if (item.prev_size_quantity) {
            let obj = item.prev_size_quantity;
            obj.forEach(elem => {
                if (elem.value) {
                    sizes++
                }
            })
            return sizes
        }
    }

    updateItem(item, itemNumber) {
        if (this.displayErorDiscount[item.id] || this.displayErorDiscount[item.id] || this.displayErorQuantity || this.displayErorPrepackQuantity || this.errorQuantityMes || this.errorQuantityMes[item.id]) {
            this.cancelUpdateItem(item, itemNumber);
            this.errorQuantityMes = false;
            return
        }
        console.log(item);
        console.log(itemNumber);
        this.displayErorDiscount[item.id] = false
        this.displayErorPrepackQuantity = false
        this.displayErorQuantity = false
        this.isItemEditing[item.id] = false
        this.isOrderChanged = true
        this.recalculatePrices(this.order);
        if (item.size_quantities) {
            let totalQuantity = null;
            let finalSizes = JSON.parse(JSON.stringify(item.size_quantities));
            let sizes = finalSizes.reduce((acc, cur) => ({ ...acc, [cur.key]: Number(cur.value) }), {});
            // Object.keys(sizes).forEach((key) => (sizes[key] == 0) && delete sizes[key]);
            if (Object.keys(sizes).length === 0) {
                this.displayErorQuantity = true;
            } else  if (Object.keys(sizes).length > 0) {
                this.displayErorQuantity = false;
                item.size_quantities = Object.entries(sizes).map(([key, value]) => ({key,value}));
                item.size_quantities.sort(function (a, b) { return a.key-b.key; });
                this.isItemEditing[itemNumber] = false;
            }
        } else {
            if (!item.quantity) {
                this.displayErorPrepackQuantity = true;
            } else {
                this.displayErorPrepackQuantity = false;
                item.quantity = Number(item.quantity);
                this.isItemEditing[itemNumber] = false;
            }
        }
        
        item.delete = false;
        this.applyOrderChanges();
    }
    
    cancelUpdateItem(item, itemNumber) {
        this.errorMinPrice[itemNumber] = false;
        this.displayErorDiscount[item.id] = false
        this.displayErorPrepackQuantity = false
        this.displayErorQuantity = false
        this.isItemEditing[item.id] = false
        
        let original_item_idx = null
        let order_item_idx = null
        for (let i=0; i < this.order.items.length; i++) {
            this.biddingPrice[i] = `${item.product.price} ${item.product.currency}`;
            if (this.order.items[i].id === item.id) {
                order_item_idx = i
                break
            }
        }
        
        for (let i=0; i < this.originalOrder.items.length; i++) {
            if (this.originalOrder.items[i].id === item.id) {
                original_item_idx = i
                break
            }
        }
        
        if (order_item_idx !== null && original_item_idx !== null) {
            this.order.items[order_item_idx] = JSON.parse(JSON.stringify(
                this.originalOrder.items[original_item_idx]
            ))
        }
        
    }
    
    applyOrderChanges() {
        console.log(this.order);
        console.log(this.priceChange);
        let items = [];
        let order_items = this.order.items
        for (let i=0; i < order_items.length; i++) {
            let order_item = order_items[i]
            if (order_item.size_quantities) {
                Object.keys(order_item.size_quantities).forEach((key) => {
                        for (let j = 0; j < order_item.size_quantities.length; j++) {
                            if (!order_item.size_quantities[j].value) {
                                order_item.size_quantities.splice(j, 1)
                            }
                        }
                    }
                );
            }
            let new_item = {
                'id': order_item.id,
                'product_id': order_item.product.id,
                'bidding_price': order_item.bidding_price
            }

            if (this.priceChange[i]) {
                console.log('diffetent prices');
            }
    
            if (order_item.size_quantities) {
                let finalSizes = JSON.parse(JSON.stringify(order_item.size_quantities));
                new_item['size_quantities'] = finalSizes.reduce((acc, cur) => ({...acc, [cur.key]: Number(cur.value)}), {});
            } else {
                new_item['quantity'] = order_item.quantity
                new_item['prepack_id'] = order_item.prepack.id
            }
            if (order_item.delete) {
                new_item['delete'] = true
            }
            items.push(new_item)
        }
        console.log(items)
        console.log('updating order')
        this.productsService.updateOrder(this.userService.getCurrentUserToken(), this.order.id, {'items': items})
            .subscribe(
                data => {
                    console.log('order updated')
                    this.isOrderChanged = false;
                    this.priceChange = [];
                    this.pairChange = [];
                    this.loadDialog(this.dialog.id);
                },
                error => {
                    console.log(error);
                    this.modalService.open('modal-error');
                    this.isOrderChanged = false;
                }
            );
    }

    acceptOrder() {
        this.productsService.acceptOrder(this.userService.getCurrentUserToken(), this.order.id).subscribe(
            data => {
                this.router.navigate(['/dashboard/orders/']);
            },
            error => {
                console.log(error);
            }
        );
    }

    declineOrder() {
        this.productsService.declineOrder(this.userService.getCurrentUserToken(), this.order.id).subscribe(
            data => {
                this.router.navigate(['/dashboard/orders/']);
        },
        error => {
            console.log(error);
        });
    }

    editItem(item, itemNumber) {
        this.displayItemsCountError = false;
        this.itemNumber = itemNumber;
        this.editingItem = item;
        this.modalService.open('custom-modal-10');
        this.isItemEditing[itemNumber] = true;
        console.log(this.isItemEditing);
        if(!this.displayErorDiscount && !this.displayErorPrepackQuantity) {
            if (item.size_quantities) {
                for (let i = 0; i < item.product.sizes.length; i++) {
                    if (!item.size_quantities.find(k => k.key === item.product.sizes[i].key)) {
                        item.size_quantities.push({key: item.product.sizes[i].key, value: null});
                    }
                }
            } else {
                console.log(`${item.total_price} ${item.quantity}`)
                this.prepackPrice = item.total_price / item.quantity;
            }  
        }
        console.log(this.biddingPrice)
    }

    onSortSizes(sizes, item) {
        sizes = sizes.sort(function (a, b) { return a.key-b.key; });
        return sizes;
    }

    onSizeChange(quantity, value, i) {
        console.log(quantity)
        console.log(value)
        this.recalculatePrices(this.order)
        if (!value) {
            return
        }
        if (+quantity > +value) {
            this.errorQuantity[i] = true;
        } else {
            this.errorQuantity[i] = false;
        }
        this.errorQuantityMes = !this.errorQuantity.every(elem => {
            return elem === false
        })
    }

    closeModal(id: string) {
        if(!this.displayErorPrepackQuantity && !this.displayErorQuantity
            && !this.displayItemsCountError) {
            this.modalService.close(id);
        }
    }

    mouseHovering(i) {
        this.isHovering[i] = true;
    }
    mouseLeaving(i) {
        this.isHovering[i] = false;
    }

    onInputSizes() {
        this.modalService.close('custom-modal-10');
    }

    _keyPress(event: any) {
        const pattern = /[0-9\ ]/;
        let inputChar = String.fromCharCode(event.charCode);

        if (!pattern.test(inputChar)) {
            // invalid character, prevent input
            event.preventDefault();
        }
    }

    onCheckForError(item) {
        if (!Array.isArray(item)) {
            if (item === '' || item == 0) {
                this.displayErorPrepackQuantity = true;
            } else {
                this.displayErorPrepackQuantity = false;
            }
        } else {
            let count = 0;
            for (let i = 0; i < item.length; i++) {
                count += Number(item[i].value);
            }
            if (count === 0) {
                this.displayErorQuantity = true;
            } else {
                this.displayErorQuantity = false;
            }
        }
    }

    onDiscountPlus(item, i) {
        let discount = item.product.discount.replace("%", '');
        let newDiscount = Number(discount) + 5;
        newDiscount = Math.max(0, Math.min(100, newDiscount))
        item.bidding_discount_percent = newDiscount;
        item.product.discount = newDiscount + "%";
        this.recalculatePrices(this.order)
    }

    onDiscountMinus(item, i) {
        let discount = item.product.discount.replace("%", '');
        let newDiscount = Number(discount) - 5;
        newDiscount = Math.max(0, Math.min(100, newDiscount))
        item.bidding_discount_percent = newDiscount;
        item.product.discount = newDiscount + "%";
        this.recalculatePrices(this.order)
    }

    onDiscountChange(value, item, i) {
        let pairs;
        if (item.size_quantities) {
            pairs =  item.size_quantities.reduce((a, b) => a + (+b['value'] || 0), 0);
        } else if (item.quantity) {
            pairs = item.quantity * (Object.keys(item.prepack.sizes).reduce((sum,key) => sum + parseFloat(item.prepack.sizes[key] || 0),0));
        }
        console.log(pairs);
        this.newDiscount = parseFloat(this.biddingPrice[i]).toFixed(2);
        const newPrice = parseFloat(this.newDiscount);
        if (  newPrice < 0 || newPrice > parseFloat(item.product.price)) {
            this.biddingPrice[i] = `${item.product.price} ${item.product.currency}`;
        }
        if (isNaN(newPrice)) {
            this.isNanDiscount = true;
        } else {
            this.isNanDiscount = false;
        }
        this.displayErorDiscount[item.id] = false;
        item.bidding_price = newPrice;
        item.total_price_with_discount = newPrice * pairs;
        let sumTotalDiscount = null;
        this.order.items.forEach(item => sumTotalDiscount = sumTotalDiscount + item.total_price_with_discount);
        this.totalPriceDiscount = sumTotalDiscount;

        if ( parseFloat(this.biddingPrice[i]) < Number(item.product.minimal_price)) {
            this.errorMinPrice[i] = true;
        } else {
            this.errorMinPrice[i] = false;
        }
        console.log(item);
        this.recalculatePrices(this.order)
    }
    setChangeStyle(item, i) {
        if (this.pairChange[i] ) {
            return {'background-color': 'rgba(64, 153, 213, 0.2)'};
        }
    }
    setChangeStylePrice(item, i) {
        if (this.priceChange[i]) {
            return {'background-color': 'rgba(64, 153, 213, 0.2)'};
        }
    }
    recalculatePrices(order) {
        console.log(order);
        const ordersLength = this.order.items.length;
        let finalSizesQuantity = 0;
        for (const item of order.items) {
            if (item.size_quantities) {
                let totalQuantity = null;
                let finalSizes = JSON.parse(JSON.stringify(item.size_quantities));
                let sizes = finalSizes.reduce((acc, cur) => ({...acc, [cur.key]: Number(cur.value)}), {});
                Object.keys(sizes).forEach((key) => (sizes[key] == 0) && delete sizes[key]);
                const sumValues = obj => Object.values(obj).reduce((a, b) => +a + +b);
                totalQuantity = sumValues(sizes);
                finalSizesQuantity = totalQuantity;
                let total_price = item.product.price * totalQuantity;
                console.log(total_price);
                item.total_price = total_price;
            } else {
                item.quantity = Number(item.quantity) || 0;
                console.log(this.prepackPrice)
                console.log(typeof(item.quantity))
                item.total_price = this.prepackPrice * item.quantity;
                let prepack_pairs = 0
                for (const key in item.prepack.sizes) {
                    if (item.prepack.sizes.hasOwnProperty(key)) {
                        prepack_pairs += parseInt(item.prepack.sizes[key])
                    }
                }
                finalSizesQuantity = prepack_pairs;
            }

            item.total_price_with_discount = item.total_price
            if (item.product.is_bidding_allowed) {
                item.total_price_with_discount = item.bidding_price * finalSizesQuantity;
            }
            if (item.product.has_discount) {
                item.total_price_with_discount = item.total_price * (100 - parseFloat(item.product.discount) / 100.0)
            }

            console.log(`${item.id} ${item.total_price} ${item.total_price_with_discount} ${item.bidding_price}`)
        }

        this.totalPrice = this.order.items.reduce((a, b) => +a + +b.total_price, 0);
        this.totalPriceDiscount = this.order.items.reduce((a, b) => +a + +b.total_price_with_discount, 0);
     }
    onGotoSelectProducts() {
        if (this.scope === 'seller') {
            this.router.navigate(['/dashboard/seller', {data: 'orderEdit', order: this.dialog.subject_id}]);
        } else {
            this.router.navigate(['/dashboard/buyer/order-edit', {data: 'orderEdit', order: this.dialog.subject_id}]);
        }
    }
    priceToNumber(str: string) {
        return (parseFloat(str)).toFixed(2);
    }
    onOpenDetailChange(item, i) {
        this.modalService.open('sizes-changes');
        this.modalProduct = item;
        if (this.scope === 'buyer') {
            this.viewChange[i] = true;
        }

        console.log(this.modalProduct);
    }
    oldPrice(price) {
        return parseFloat(price).toFixed(2);
    }

    openModal(id) {
        this.modalService.open(id);
    }
    closeConfirmWindow(id) {
        this.modalService.close(id);
    }
    checkForDiscount(bid_price, prod_price) {
        return parseFloat(bid_price) !== parseFloat(prod_price)
    }
    checkForPriceChange() {
        return this.priceChange.some(item => item);
    }
    checkForPairChange() {
        return this.pairChange.some(item => item);
    }
    
    rateOrder(id: number, rating: number, e: Event) {
        e.stopPropagation();
        this.orderService.rateOrder(this.userService.getCurrentUserToken(), id, rating)
            .subscribe((data : any) => {
                this.loadDialog(this.dialogId)
            })
    }

    getRating(dialog: Dialog) {
        let role = this.userService.getCurrentUser().scope[0];
        return dialog.users.find(e => {
            return e.reg_type !== role
        })['average_rating'];
    }
}
