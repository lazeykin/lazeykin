
import { ModalService } from './../../../../_services/modal.service';
import { UserService } from './../../../../_services/user.service';
import { FormService } from './../../../../_services/form';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { OrdersService } from '../../../../_services';

@Component({
    selector: 'app-documents',
    templateUrl: './documents.component.html',
    styleUrls: ['./documents.component.sass']
})
export class DocumentsComponent implements OnInit {
    constructor(
        private formService: FormService,
        private orderService: OrdersService,
        private userService: UserService,
        private modalService: ModalService
    ) { }

    form = new FormGroup({
        // name: new FormControl('', [Validators.required, Validators.maxLength(120)]),
        file: new FormControl('', [Validators.required])
    })
    url: any;
    fileError: boolean = false;
    fileFormatError: boolean = false;
    files: any = [];
    isLoading: boolean = false;

    ngOnInit(): void {
        this.getAllDocuments();
    }

    closeModal(id) {
        this.modalService.close(id)
    }
    readDocument(event: any) {
        this.fileError = false;
        if (event.target.files && event.target.files[0]) {
            var reader = new FileReader();

            reader.onload = (event: ProgressEvent) => {
                this.url = (<FileReader>event.target).result;
            }

            reader.readAsDataURL(event.target.files[0]);
        }
        this.form.controls.file.setValue(event.target.files[0])
        this.uploadDocument();
    }

    uploadDocument() {
        this.fileError = false;
        this.fileFormatError = false;
        if(!this.form.valid) {
            this.formService.markTouched(this.form);
            if(!this.form.controls.file.value)
                this.fileError = true;
            return;
        }
        else {
            this.fileFormatError = false;

            // let batchArr = [];
            // const user_id = this.userService.getCurrentUser()['user']['id'];

            // this.form.controls.file.value.forEach(element => {
            //     const formData = new FormData();
            //     formData.append('user_id', user_id);
            //     formData.append('file', element);
            //     batchArr.push({
            //         "method": "POST",
            //         "path": `/api/v1/profile/files/`,
            //         "data": formData
            //     })
            // });
            
            // this.orderService.batch(this.userService.getCurrentUserToken(), {"operations": batchArr})
            //     .subscribe(_ => {
            //         this.modalService.open('custom-modal-success');
            //         this.getAllDocuments();
            //     }, error => {
            //         this.modalService.open('custom-modal-error')
            //     })
            let file = this.form.controls.file.value;

            this.orderService.uploadDocument(this.userService.getCurrentUserToken(), this.userService.getCurrentUser()['user']['id'], file)
                .subscribe(_ => {
                    this.modalService.open('custom-modal-success')
                    this.getAllDocuments();
                }, error => {
                    this.modalService.open('custom-modal-error')
                })
        }
        
    }

    getFileName(str) {
        return str.slice(str.lastIndexOf('_') + 1);
    }

    getFileUrl(url) {
        return window.location.href.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/)[1] + '/' + url;
    }

    getAllDocuments() {
        this.isLoading = true;
        this.orderService.getAllDocuments(this.userService.getCurrentUserToken())
            .subscribe(files => {
                this.files = files['results'];
                this.isLoading = false;
            }, error => {
                this.isLoading = false;
            })
    }

    deleteDocument(id) {
        this.orderService.deleteDocumentById(this.userService.getCurrentUserToken(), id)
            .subscribe(_ => {
                this.getAllDocuments();
            })
    }
}
