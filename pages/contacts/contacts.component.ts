import { ModalService } from './../../../../_services/modal.service';
import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import {MessengerService} from '../../../../_services/messenger.service';
import {Contact, Paginated} from '../../../../_models';
import {PaginationChangedEvent} from '../../../../events';
import {Observable, Subject} from 'rxjs';
import {debounceTime, merge, share, startWith, switchMap} from 'rxjs/operators';
import {UserService} from "../../../../_services";
import {PaginationComponent} from "../../components/pagination/pagination.component";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.sass']
})
export class ContactsComponent implements OnInit {
    searchText = ''

    isLoading = true
    message = ''
    contacts: Array<Contact> = []
    scope: string;

    contactGroups: any = [];

    selItem: any = [];
    selectedMembers = [];
    showGroupAction: boolean = false;
    count: number = 0;
    contactsToAdd = [];
    showSuccess: boolean = false;
    singleMember: number;
    error: boolean = false;


    activeFilter = 'all';
    // TODO / temporary 
    tempContacts = [];
    
    selectGroup = new FormGroup({
        group: new FormControl('', Validators.required)
    })

    @ViewChild(PaginationComponent) pagination
    
    
    constructor(
        private messengerService: MessengerService,
        private userService: UserService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private modalService: ModalService
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
                this.pagination.totalRows = response.count
                this.contacts = response.results
                this.tempContacts = this.contacts
            },
            error => {
                console.log('Error')
                console.log(error)
                this.isLoading = false
                this.error = true
                this.message = 'Something goes wrong. Please, refresh the page and try again'
            }
        );
    }
    
    loadContactGroups() {
        this.messengerService.getContactGroup(this.userService.getCurrentUserToken())
            .subscribe(
                data => {
                    this.contactGroups = data['results']
                }
            )
    }

    ngOnInit(): void {
        this.searchText = this.activatedRoute.snapshot.queryParamMap.get('search')
        var user = this.userService.getCurrentUser();
        if(user) {
            this.scope = user.scope[0];
        }
        else {
            this.scope = 'notRegistered'
        }
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


    filterCategory(type) {
        this.activeFilter = type;
        if(type === 'all')
            this.loadContacts(this.searchText);
        else if (type === 'shoonic') 
            this.loadContacts(this.searchText)
        else if (type === 'other')
            this.contacts = this.tempContacts.filter(e => {return !e['id']})

        if(!this.contacts.length) {
            this.message = 'No contacts found.'
        }
        else {
            this.message = ''
        }
    }

    checkIfAdded(id) {
        return this.contactsToAdd.some(e => e === id);
    }

    checkSelected() {
        return this.selectedMembers.some(e => {
            return this.contactsToAdd.indexOf(e) > -1
        })
    }

    closeModal() {
        this.modalService.close("modal-add-to-group")
        this.showSuccess = false;
    }
    onContactAdd() {
        this.loadContactGroups();
        this.showSuccess = false;
        this.modalService.open("modal-add-to-group");
    }

    addContactsToGroup() {

        //batch return method post not allowed TODO

        let selected = this.selectGroup.controls.group.value;
        if(!selected) {
            this.selectGroup.markAsTouched();
            return;
        }


        if(this.singleMember) {
            this.selectedMembers = [];
            this.selectedMembers.push(this.singleMember)
        }
        for(let c of this.selectedMembers) {
            console.log(c)
            this.messengerService.addContactToGroup(this.userService.getCurrentUserToken(), selected.id, {user_id: c})
            .subscribe(
                data => {
                    console.log(data);
                    this.showSuccess = true;
                    this.selectGroup.reset();
                    this.selectedMembers = [];
                    this.count = 0;
                    this.showGroupAction = false;
                    this.selItem = [];
                    this.singleMember = null;
                }
            )
        }

    }

    addContact(id) {
        this.singleMember = id;
        this.loadContactGroups();
        this.modalService.open("modal-add-to-group");

    }


}
