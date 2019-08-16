import { FormService } from './../../../../_services/form';
import {Component, OnInit, ViewChild} from '@angular/core';
import {UserService, ModalService, AlertService} from '../../../../_services/index';
import {Inject} from '@angular/core';
import {DOCUMENT} from '@angular/platform-browser';
import {FormControl, FormGroup, NgForm, Validators} from '@angular/forms';
import {ProductsService} from '../../../../_services';
import {Location} from '@angular/common';
import {CustomValidator} from '../../../../_services/custom_validators';
import {LanguageService} from '../../../../_services/language.service';

@Component({
    templateUrl: 'sales-identity.component.html',
    styleUrls: ['sales-identity.component.sass']
})

export class MessengerSellerAccountSIComponent implements OnInit {
    @ViewChild('f') public form: NgForm;
    sales: any = [];
    url: string;
    displayForm: boolean = false;
    hideButton: boolean = false;
    countrySelect: any = {};
    countries: any = [];
    productChoises: any = {};
    salesInfo: any = {};
    model: any = {
        name: '',
        vat_number: '',
        contact_person: '',
        email: '',
        phone_number: '',
        address: {
            name: '',
            first_line: '',
            second_line: '',
            country: '',
            state: '',
            city: '',
            zip: ''
        }
    };

    emailStyle = {
            'display': 'block',
            'margin-top': '9px'
    }
    form_group = new FormGroup({
        address: new FormGroup({
            zip: new FormControl('',
                [<any>Validators.required, <any>CustomValidator.zipCodeValidator, <any>Validators.maxLength(80)]),
            city: new FormControl('',
                [<any>Validators.required, <any>Validators.maxLength(80)]),
            state: new FormControl('',
                [<any>Validators.maxLength(80)]),
            street_name: new FormControl('',
                [<any>Validators.required, <any>Validators.maxLength(80)]),
            country: new FormControl('', [<any>Validators.required]),
            street_number: new FormControl('',
                [<any>Validators.required, <any>Validators.maxLength(80)]),
            bus: new FormControl('', [<any>Validators.maxLength(10)])
        }),
        contact_person: new FormControl('',
            [<any>Validators.maxLength(80)]),
        vat_number: new FormControl('',
            [<any>Validators.required, <any>Validators.maxLength(80)]),
        website_address: new FormControl('',
            [<any>CustomValidator.urlValidator, <any>Validators.maxLength(200)]),
        email: new FormControl('',
            [<any>Validators.maxLength(256), <any>Validators.email, <any>Validators.required]),
        phone_number: new FormControl('', [<any> Validators.maxLength(13), <any> Validators.required]),
        name: new FormControl('',
                [<any>Validators.required, <any>Validators.maxLength(80)])
    });


    constructor(
        @Inject(DOCUMENT) private document: Document,
        private userService: UserService,
        private location: Location,
        private productsService: ProductsService,
        private alertService: AlertService,
        private modalService: ModalService,
        private formService: FormService,
        private languageService: LanguageService) {
    }

    ngOnInit() {
        this.form_group.valueChanges.subscribe(x => {
            this.model = Object.assign({}, x);
        });

        this.getSI();
        this.languageService.currentLanguage.subscribe(lang => {
            this.productsService.productChoises(this.userService.getCurrentUserToken(), lang)
                .subscribe(
                    data => {
                        this.productChoises = data;
                        this.countries = this.productChoises.country;
                    },
                    error => {
                        console.log('Eror data');
                    });
        })
    }

    getSI() {
        this.productsService.allSI(this.userService.getCurrentUserToken()).subscribe(response => {
            this.sales = response;
        });
    }
    closeModal(id: string) {
        this.modalService.close(id);
    }


    addSI() {
        this.displayForm = true;
    }

    editSI(id) {
        this.hideButton = true;
        this.displayForm = true;
        this.productsService.editSI(this.userService.getCurrentUserToken(), id).subscribe(response => {
            this.salesInfo = response;
            this.form_group.patchValue(this.salesInfo);
        });

    }

    deleteSI(id) {
        this.productsService.deleteSI(this.userService.getCurrentUserToken(), id).subscribe(response => {
            this.getSI();
        });
    }

    saveSINew() {
        // website is ignored, missing on backend
        // street_number is mandatory, shouldn't be
        if(this.form_group.valid) {
            this.form_group.disable();
            this.model.address.country = this.model.address.country.id;
            if (this.hideButton) {
                this.productsService.updateSI(this.model, this.salesInfo.id, this.userService.getCurrentUserToken())
                    .subscribe(
                        data => {
                            this.getSI();
                            this.displayForm = false;
                            this.form_group.reset();
                            this.form_group.enable();
                            this.hideButton = false;
                            //this.modalService.open("custom-modal-2");
                        },
                        error => {
                            this.alertService.errorRegistration(error, this.form);
                            this.form_group.enable();
                        });
            } else {
                this.productsService.saveSI(this.model, this.userService.getCurrentUserToken())
                    .subscribe(
                        data => {
                            this.getSI();
                            this.displayForm = false;
                            this.form_group.reset();
                            this.form_group.enable();
                            //this.modalService.open("custom-modal-2");
                        },
                        error => {
                            this.alertService.errorRegistration(error, this.form);

                            this.form_group.enable();
                        });
            }
        }
        else {
            this.formService.markTouched(this.form_group);
        }
        
    }

    compareTech(t1, t2): boolean {
        return t1 && t2 ? t1 === t2 : t1 === t2;
    }

    selectCountry() {
        this.model.country = this.countrySelect.id;
    }
}
