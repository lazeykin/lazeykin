import {Component, OnInit, ViewChild} from '@angular/core';
import {MessengerService, UserService} from '../../../../_services';
import {ActivatedRoute, Router} from '@angular/router';
import {PaginationComponent} from '../../components/pagination/pagination.component';
import {PaginationChangedEvent} from '../../../../events';
import {FormArray, FormControl} from '@angular/forms';

@Component({
  selector: 'app-contact-groups',
  templateUrl: './contact-groups.component.html',
  styleUrls: ['./contact-groups.component.sass']
})
export class ContactGroupsComponent implements OnInit {
    contactGroups: any = []
    message: string
    searchText = ''
    response: any = {}
    @ViewChild(PaginationComponent) pagination
    isLoading = true
    selItem: any = []
    groupArr: any = []
    showGroupAction = false
    count: number;
    error: boolean = false;
  constructor(
      private messengerService: MessengerService,
      private userService: UserService,
      private activatedRoute: ActivatedRoute,
      private router: Router
  ) { }

  ngOnInit() {
      this.searchText = this.activatedRoute.snapshot.queryParamMap.get('search')
  }
  loadContactGroups(search:string='', limit=null, offset=0) {
      this.error = false;
      if (limit == null) {
          limit = this.pagination.pageSize
      }
      this.isLoading = true;
      let params = {
          search: this.searchText,
          limit: limit,
          offset: offset
      }
      this.messengerService.getContactGroup(this.userService.getCurrentUserToken(), params)
          .subscribe(response => {
              console.log(response)
              this.response = response
              this.isLoading = false
              this.pagination.totalRows = this.response.count;
              if (this.response.count === 0) {
                  this.message = 'No contact groups found.'
                  this.contactGroups = [];
              } else {
                  this.contactGroups = this.response.results;
                  this.message = '';
              }
          }, error => {
          console.log('Error')
          console.log(error)
          this.isLoading = false
          this.error = true;
      })
  }
    onPageChanged(info:PaginationChangedEvent) {
        console.log('onPageChanged')
        this.loadContactGroups(this.searchText, info.fetch, info.offset)
    }
    onSearchClick() {
        if(!this.searchText)
            return
        this.loadContactGroups();
        this.count = 0;
        this.groupArr = [];
        this.showGroupAction = false;
        this.selItem = [];
    }

    getGroupLink(group) {
        return ['/dashboard/messenger/group/edit', group.id]
    }
    onGroupDelete(group) {
      let groupId = group.id;
      this.messengerService.deleteContactGroup(this.userService.getCurrentUserToken(), groupId).
      subscribe(response => {
        console.log(response);
        this.loadContactGroups()
      },error => {
        console.log(error)
          this.message = 'Something goes wrong. Please, refresh the page and try again'
      })
    }
    onAddGroup() {
        this.router.navigate(['dashboard/messenger/group/add'])
    }
    onSelectedItem(id, selectValue) {
        if(selectValue) {
            this.groupArr.push(id);
        } else {
            let index = this.groupArr.indexOf(id);
            this.groupArr.splice(index, 1)
        }
        console.log(this.groupArr)

        if(this.groupArr.length>0) {
            this.showGroupAction = true;
        }else {
            this.showGroupAction = false;
        }
        this.count = this.groupArr.length;
    }
    deleteGroups() {
        this.messengerService.deleteMultipleContactGroups(this.userService.getCurrentUserToken(), this.groupArr)
            .subscribe(
                data => {
                    this.loadContactGroups();
                    this.selItem = [];
                    this.groupArr = [];
                    this.count = 0;
                    this.showGroupAction = false;
                }
            )
    }
    onClearFiltersClick() {
        this.searchText = ''
        this.loadContactGroups()
    }
}
