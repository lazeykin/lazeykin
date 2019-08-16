import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';

import {MessengerService} from '../../../../_services/messenger.service';
import {Contact, Paginated} from '../../../../_models';
import {PaginationChangedEvent} from '../../../../events';
import {Observable, Subject} from 'rxjs';
import {debounceTime, merge, share, startWith, switchMap} from 'rxjs/operators';
import {AlertService, ModalService, UserService} from '../../../../_services';
import {PaginationComponent} from "../../components/pagination/pagination.component";
import {ActivatedRoute, Router} from '@angular/router';
import {FormService} from '../../../../_services/form';

@Component({
  selector: 'app-edit-group',
  templateUrl: './edit-group.component.html',
  styleUrls: ['./edit-group.component.sass']
})
export class EditGroupComponent implements OnInit {
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
    cg_member_id: string
    searchText = ''
    selItem: any = [];
    contactItem: any = [];
    selectedContacts: any = [];
    isLoading = true
    response: any = {}
    cg_id: string
    specificGroup: any = {
        id: '',
        desccription: '',
        name: '',
        total_contacts: ''
    }
    message = ''
    showGroupAction: boolean = false
    productArr: any = [];
    contacts: Array<Contact> = []
    model: any = {
        name: '',
        description: '',
        initial_user_ids: []
    }
    contactModel: any = {
        name: '',
        company: '',
        email: ''
    }

    showSuccess: boolean = false;
    allContactList: any = [];
    tempAllContactList: any = [];
    selectedMembers = [];
    activeFilter = 'all';
    // TODO / temporary 
    tempContacts = [];
    error: boolean = false;

    @ViewChild(PaginationComponent) pagination


    constructor(
        private messengerService: MessengerService,
        private userService: UserService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private modalService: ModalService,
        private alertService: AlertService
    ) { }
    loadContacts(search:string='', limit=null, offset=0) {
        this.error = false;
        if (limit == null) {
            limit = this.pagination.pageSize
        }
        this.isLoading = true
        this.contacts = []
        let params = {
            'search': search,
            'limit': limit,
            'offset': offset,
        }
        this.messengerService.getContactGroupMembers(this.userService.getCurrentUserToken(), this.cg_id, params).subscribe(
            response => {
                console.log(`Got response for search=${search}`)
                this.isLoading = false
                this.response = response
                // this.cg_member_id = this.response.results.user.id;
                this.message = ''
                this.pagination.totalRows = response.count;
                console.log(response)
                this.contacts = this.response.results
                //TODO / temp
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
    getPersonalGroup() {
        this.cg_id = this.activatedRoute.snapshot.paramMap.get('cg_id');
        this.messengerService.getSpecificGroup(this.userService.getCurrentUserToken(), this.cg_id)
            .subscribe(response => {
                console.log(response);
                this.specificGroup = response;
                this.form_group.patchValue(this.specificGroup);
            }, error => {
                console.log('Error')
                console.log(error)
                this.message = 'Something goes wrong. Please, refresh the page and try again'
            })
    }

    ngOnInit(): void {
        console.log(this.form_group)
        console.log(this.form_contact)
        this.searchText = this.activatedRoute.snapshot.queryParamMap.get('search')
        this.form_group.valueChanges.subscribe(model => {
            this.model = Object.assign({}, model)
        })
        this.form_contact.valueChanges.subscribe(model => {
            this.contactModel = Object.assign({}, model)
        })
        this.getPersonalGroup();
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

    onSelectedContact(id, selectValue) {
        if(selectValue) {
            this.selectedContacts.push(id);
        } else {
            let index = this.selectedContacts.indexOf(id);
            this.selectedContacts.splice(index, 1)
        }
        console.log(this.selectedContacts)
        console.log(this.contactItem)
    }
    onEditGroup() {
        this.error = false;
        if (!this.form_group.valid) {
            new FormService().markTouched(this.form_group);
            return;
        } else {
            new FormService().markTouched(this.form_group);
        }
        this.messengerService.editContactGroup(this.userService.getCurrentUserToken(), this.cg_id, this.model)
            .subscribe( response => {
                this.isLoading = false
                console.log(response)
                this.modalService.open('custom-modal-6')
                // this.router.navigate(['/dashboard/messenger/groups'])
            }, error => {
                    console.log('Error')
                    console.log(error)
                    this.error = true;
                    this.message = 'Something goes wrong. Please, refresh the page and try again'
                })
    }
    onRemoveContact(id) {
        this.error = false;
        this.messengerService.removeGroupMember( this.userService.getCurrentUserToken(), this.cg_id, id)
            .subscribe( () => {
                this.loadContacts()
            }, error => {
                console.log('Error')
                console.log(error)
                this.error = true;
                this.message = 'Something goes wrong. Please, refresh the page and try again'
            })
    }

    removeMultipleContacts() {
        this.messengerService.removeMultipleContacts(this.userService.getCurrentUserToken(), this.cg_id, this.selectedMembers)
            .subscribe(
                data => {
                    this.loadContacts();
                    this.selectedMembers = [];
                    this.count = 0;
                    this.selItem = [];
                    this.showGroupAction = false;
                }
            )
    }

    onNewContactAdd() {
       this.modalService.open("custom-modal-4");
    }

    onCancel() {
        this.modalService.close("custom-modal-4")
    }
    onSubmit() {
        if (!this.form_contact.valid) {
            new FormService().markTouched(this.form_contact);
            return;
        } else {
            new FormService().markTouched(this.form_contact);
        }
        this.messengerService.addContactToGroup( this.userService.getCurrentUserToken(),
            this.cg_id, this.contactModel).subscribe( response => {
                console.log(response)
                this.modalService.close("custom-modal-4");
                this.form_contact.reset();
                this.loadContacts();
        }, error => {
            console.log('Error');
            console.log(error);
            this.alertService.errorRegistration(error, this.form_contact);
        })
    }
    closeModal(id) {
        this.modalService.close(id);
        this.selectedContacts = [];
        this.contactItem = [];
        //this.router.navigate(['dashboard/messenger/groups'])
    }

    // TODO / temporary
    filterCategory(type) {
        this.activeFilter = type;
        if(type === 'all')
            this.loadContacts(this.searchText);
        else if (type === 'shoonic') 
            this.contacts = this.tempContacts.filter(e => {return e['user']})
        else if (type === 'other')
            this.contacts = this.tempContacts.filter(e => {return !e['user']})

        if(!this.contacts.length) {
            this.message = 'No contacts found.'
        }
        else {
            this.message = ''
        }
    }

    filterCategoryAll(type) {
        this.activeFilter = type;
        if(type === 'all')
            this.getContacts();
        else if (type === 'shoonic') 
            this.allContactList = this.tempAllContactList.filter(e => {return e})
        else if (type === 'other')
            this.allContactList = this.tempAllContactList.filter(e => {return !e})

        if(!this.contacts.length) {
            this.message = 'No contacts found.'
        }
        else {
            this.message = ''
        }
    }


    getContacts() {
        this.messengerService.getContacts(this.userService.getCurrentUserToken(), {
            'limit': 100,
            'offset': 0,
        }).subscribe(
            data => {
                this.allContactList = data['results']
                this.tempAllContactList = this.allContactList;
            }
        )
    }
    onExistingContactAdd() {
        this.getContacts();
        this.modalService.open('modal-add-to-group')
    }

    addContactsToGroup() {
        for(let c of this.selectedContacts) {
            this.messengerService.addContactToGroup(this.userService.getCurrentUserToken(), this.cg_id, {user_id: c})
                .subscribe(
                    data => {
                        this.count = 0;
                        this.showGroupAction = false;
                        this.selectedContacts = [];
                        this.selectedMembers = [];
                        this.selItem = [];
                        this.loadContacts();
                        this.closeModal('modal-add-to-group');
                    }
                )
        }
            
    }

    selectAllContacts() {
        for(let i = 0; i < this.allContactList.length; i++) {
            this.contactItem[i] = true
        }
        Object.assign(this.selectedContacts, this.allContactList.map(e => e.id))
    }
}

