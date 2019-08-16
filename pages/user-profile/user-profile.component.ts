import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MessengerService, ModalService, ProductsService, UserService} from '../../../../_services';
import {LanguageService} from '../../../../_services/language.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.sass']
})
export class UserProfileComponent implements OnInit {
    cg_id: string
    cg_member_id: string
    response: any
    productChoises: any = {}
    countries: any = []
    country: string = ''
    groups: any = []
    message: string
    error: boolean = false 
    user: any = {
        company_name: '',
        first_name: '',
        full_name: '',
        id: '',
        last_name: '',
        photo: {id: '', url: ''},
        reg_type: '',
        user_type: ''
    }
    company: any = {
        address: {
            bus: '',
            city: '',
            country: '',
            id: '',
            state: '',
            street_name: '',
            street_number: '',
            zip: ''
        },
    id: '',
    logo: {
            id: '',
            url: '',

    },
    name: '',
    owner_id: '',
    status: '',
    vat_number: '',
    website_address: ''
    }
  constructor(
      private activatedRoute: ActivatedRoute,
      private messengerService: MessengerService,
      private userService: UserService,
      private productsService: ProductsService,
      private router: Router,
      private modalService: ModalService,
      private languageService: LanguageService
  ) { }

  ngOnInit() {
    this.cg_id = this.activatedRoute.snapshot.paramMap.get('cg_id')
      console.log(this.cg_id)
      this.cg_member_id = this.activatedRoute.snapshot.paramMap.get('cg_member_id')
      console.log(this.cg_member_id)
      this.getContactFullInfo()
  }
  getContactFullInfo() {
    this.messengerService.getFullContactInfo( this.userService.getCurrentUserToken(), this.cg_id, this.cg_member_id)
        .subscribe(response => {
          console.log(response)
            this.response = response
            this.groups = this.response.contact_groups
            if (this.groups.length === 0) {
               this.message = 'There are not any contact group'
            }
            this.user = this.response.user
            this.company = this.response.company;
            this.languageService.currentLanguage.subscribe(lang => {
                this.productsService.productChoises(this.userService.getCurrentUserToken(), lang)
                    .subscribe(
                        data => {
                            this.productChoises = data;
                            this.countries = this.productChoises.country;
                            this.country = this.countries.find(x => x.id === this.company.address.country);
                        },
                        error => {
                            console.log("Eror data");
                        });
            })

        }, error => {
          console.log('Error')
            console.log(error)
        })
  }

    onItemRemove(group) {
        this.error = false;
        console.log(group)
        const id = group.id
        console.log(id)
        console.log(this.cg_member_id)
        this.messengerService.removeGroupMember( this.userService.getCurrentUserToken(), id, this.cg_member_id)
             .subscribe( () => {
                 this.modalService.open('custom-modal-8')
                //this.getContactFullInfo();
             }, error => {
                 console.log('Error')
                 console.log(error)
                 this.error = true;
                this.message = 'Something goes wrong. Please, refresh the page and try again'
             })
    }
    closeModal(id) {
        this.modalService.close(id)
        this.router.navigate(['dashboard/messenger/groups'])
    }

}
