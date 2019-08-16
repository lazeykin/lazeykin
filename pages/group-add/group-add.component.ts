import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';

import {MessengerService} from '../../../../_services/messenger.service';
import {Contact, Paginated} from '../../../../_models';
import {PaginationChangedEvent} from '../../../../events';
import {Observable, Subject} from 'rxjs';
import {debounceTime, merge, share, startWith, switchMap} from 'rxjs/operators';
import {ModalService, UserService} from '../../../../_services';
import {PaginationComponent} from "../../components/pagination/pagination.component";
import {ActivatedRoute, Router} from '@angular/router';
import {FormService} from '../../../../_services/form';

@Component({
  selector: 'app-group-add',
  templateUrl: './group-add.component.html',
  styleUrls: ['./group-add.component.sass']
})
export class GroupAddComponent implements OnInit {
  form_group = new FormGroup({
      name: new FormControl('',
          [<any> Validators.required, <any> Validators.maxLength(80)]),
      description: new FormControl('',
          [<any> Validators.required, <any> Validators.maxLength(360)]),
      initial_user_ids: new FormArray([])
  })

  form_contact = new FormGroup({
    name: new FormControl(''),
    company: new FormControl(''),
    email: new FormControl('', [Validators.email, Validators.required])
})
    count: number
    searchText = ''
    selItem: any = [];
    isLoading = true
    message = ''
    showGroupAction: boolean = false
    productArr: any = [];
    contacts: Array<Contact> = []
    model: any = {
        name: '',
        description: '',
        initial_user_ids: []
    }
    error: boolean = false;
    toShowroom: boolean;
    showroomId: any;
    contactId: any;
    data: any;


    selectedMembers = [];
    activeFilter = 'all';
    // TODO / temporary 
    tempContacts = [];
    contactsToAdd = [];

    @ViewChild(PaginationComponent) pagination


    constructor(
        private messengerService: MessengerService,
        private userService: UserService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private modalService: ModalService,
        private route: ActivatedRoute
    ) { }
    loadContacts(search:string='', limit=null, offset=0) {
        this.error = false;
        if (limit == null) {
            limit = this.pagination.pageSize
        }
        this.isLoading = true
        this.contacts = []
        this.messengerService.getContacts(this.userService.getCurrentUserToken(), {
            'search':search,
            'limit': limit,
            'offset': offset,
        }).subscribe(
            response => {
                console.log(`Got response for search=${search}`)
                this.isLoading = false
                this.message = ''
                this.pagination.totalRows = response.count;
                console.log(response)
                    this.contacts = response.results
                    this.tempContacts = this.contacts
            },
            error => {
                console.log('Error')
                console.log(error)
                this.isLoading = false
                this.error = true;
                this.message = 'Something goes wrong. Please, refresh the page and try again'
            }
        );
    }

    ngOnInit(): void {
    this.toShowroom = this.route.snapshot.queryParams.showroom;
    this.showroomId = this.route.snapshot.queryParams.showroomId;
    console.log(this.showroomId);
      console.log(this.form_group);
        this.searchText = this.activatedRoute.snapshot.queryParamMap.get('search')
        this.form_group.valueChanges.subscribe(model => {
            this.model = Object.assign({}, model)
        })
    }

    onPageChanged(info:PaginationChangedEvent) {
        this.loadContacts(this.searchText, info.fetch, info.offset)
    }

    onClearFiltersClick() {
        this.searchText = ''
        this.loadContacts(null)
    }

    onSearchClick() {
        this.loadContacts(this.searchText)
    }
    onAddGroup() {
        this.router.navigate(['dashboard/messenger/group/add'])
    }
    onSelectedItem(id, selectValue) {
        if(selectValue) {
            this.selectedMembers.push(id);
        } else {
            let index = this.selectedMembers.indexOf(id);
            this.selectedMembers.splice(index, 1)
        }

        if (this.selectedMembers.length > 0) {
            this.showGroupAction = true
        } else {
            this.showGroupAction = false
        }
        this.count = this.selectedMembers.length;
    }

    onSendGroup() {
        this.error = false;
        if (!this.form_group.valid) {
            new FormService().markTouched(this.form_group);
            return;
        } else {
            new FormService().markTouched(this.form_group);
        }

        this.model.initial_user_ids = this.contactsToAdd;
        this.messengerService.createContactGroup(this.userService.getCurrentUserToken(), this.model)
            .subscribe( response => {
                this.isLoading = false;
                this.data = response;
                this.contactId = this.data.id;
                console.log(response)
                this.modalService.open('custom-modal-5')
        }, error => {
                console.log('Error')
                console.log(error)
                this.error = true;
                this.message = 'Something goes wrong. Please, refresh the page and try again'
            } )
    }
    closeModal(id) {
        this.modalService.close(id)
        if(this.toShowroom) {
            this.router.navigate(['/dashboard/seller/showrooms/add'], {queryParams: {id: this.contactId}})
        }
        else if(this.showroomId) {
            this.router.navigate(['/dashboard/seller/showroom/edit/' + this.showroomId], {queryParams: {id: this.contactId}})
        }
        else {
            this.router.navigate(['dashboard/messenger/groups'])
        }
    }
    
    addContact(id) {
        this.contactsToAdd.push(id);
        console.log(this.contactsToAdd)
    }

    checkIfAdded(id) {
        return this.contactsToAdd.some(e => e === id);
    }

    checkSelected() {
        return this.selectedMembers.some(e => {
            return this.contactsToAdd.indexOf(e) > -1
        })
    }

    onContactAdd() {
        this.contactsToAdd = this.contactsToAdd.concat(this.selectedMembers)
        this.selItem = [];
        this.count = 0;
        this.selectedMembers = [];
        this.showGroupAction = false;
    }

    filterCategory(type) {
        this.activeFilter = type;
        if(type === 'all')
            this.loadContacts(this.searchText);
        else if (type === 'other') 
            this.loadContacts(this.searchText)
        else if (type === 'shoonic')
            this.contacts = this.tempContacts.filter(e => {return !e['user']})

        if(!this.contacts.length) {
            this.message = 'No contacts found.'
        }
        else {
            this.message = ''
        }
    }

    addNewContact() {
}
    onNewContactAdd() {
        this.modalService.open("custom-modal-4");
        
     }

     onCancel() {
         this.modalService.close("custom-modal-4");
     }
}
