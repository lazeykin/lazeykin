import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PaginationChangedEvent} from "../../../../events";
import {ActivatedRoute, ActivatedRouteSnapshot, ActivationEnd, NavigationStart, Router} from "@angular/router";

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.sass']
})
export class PaginationComponent implements OnInit {
    
    private _totalRows?:number = null  // null - nothing is fetched
    private _currentPage = 1
    
    @Input() pageSize:number = 10
    @Input() urlParam = 'page'
    @Input() callPageChangedOnInit = true
    
    get totalPages() {
        return Math.ceil(this._totalRows / this.pageSize)
    }
    
    @Input() set totalRows(value:number) {
        if (value != null && value <= 0) {
            value = 0
        }
        this._totalRows = value
        console.log(`rows ${this._totalRows} rpp ${this.pageSize} pages ${this.totalPages}`)
        if (this.totalPages < this.currentPage) {
            this.currentPage = this.totalPages
            this.pageChanged.next(this.getStateAsPaginationChangeEvent())
        }
    }
    
    get totalRows() {
        return this._totalRows
    }
    
    @Input() set currentPage(value:number) {
        if (value == null || value <= 0) {
            value = 1
        }
        if (this._totalRows !== null && value > this._totalRows) {
            value = this._totalRows
        }
        if (this._currentPage != value) {
            this._currentPage = value
            console.log(`new page ${value}`)
            this.updatePageInUrl()
        }
    }
    
    get currentPage() {
        return this._currentPage
    }
    
    @Output() pageChanged = new EventEmitter<PaginationChangedEvent>();
    
    getStateAsPaginationChangeEvent():PaginationChangedEvent {
        const offset = (this.currentPage - 1) * this.pageSize
        return new PaginationChangedEvent(this.currentPage, this.pageSize, offset)
    }
    
    goToFirstPage():PaginationChangedEvent {
        this.currentPage = 1;
        const offset = (this.currentPage - 1) * this.pageSize
        return new PaginationChangedEvent(this.currentPage, this.pageSize, offset)
    }

    getRouteLinkParams(page?: number) {
        const new_params = {}
        if (page == 1) {
            page = null
        }
        new_params[this.urlParam] = page
        return new_params
    }
    
    pageRange(from_or_to=2, to:number=null):Array<number>{
        let from = 2
        if (to == null) {
            to = from_or_to
        } else {
            from = from_or_to
        }
        
        from = Math.max(2, Math.min(this.totalPages, from))
        to = Math.max(from, Math.min(this.totalPages, to))
        if (to - from <= 0) {
            return []
        }
        //console.log(`from ${from} to ${to}`)
        return Array.from(Array(to - from).keys()).map(i => i + from)
    }

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
    ) { }
    
    getPageFromRouteSnapshot(snapshot:ActivatedRouteSnapshot) {
        let page = 1
        if (this.urlParam) {
            let url_page = this.activatedRoute.snapshot.queryParamMap.get(this.urlParam)
            if (url_page) {
                try {
                    page = parseInt(url_page)
                } catch (e) {
                }
            }
        }
        return page
    }
    
    ngOnInit() {
        this.currentPage = this.getPageFromRouteSnapshot(this.activatedRoute.snapshot)
        if (this.callPageChangedOnInit) {
            this.pageChanged.next(this.getStateAsPaginationChangeEvent())
        }
        this.router.events.subscribe((event) => {
            if(event instanceof ActivationEnd) {
                let new_page = this.getPageFromRouteSnapshot(this.activatedRoute.snapshot)
                if (this.currentPage != new_page) {
                    this.currentPage = new_page
                    this.pageChanged.next(this.getStateAsPaginationChangeEvent())
                }
            }
        })
    }
    
    updatePageInUrl() {
        console.log(`updatePageInUrl ${this.currentPage}`)
        if (this.urlParam) {
            // manually update url without reload, cause this is invoked from js code only
            let url_page = this.getPageFromRouteSnapshot(this.activatedRoute.snapshot)
            if (url_page != this.currentPage) {
                //https://stackoverflow.com/a/43706998/5558123
                let new_url_params = this.getRouteLinkParams(this.currentPage)
                this.router.navigate([], {
                    relativeTo: this.activatedRoute,
                    queryParams: new_url_params,
                    preserveFragment: true,
                    queryParamsHandling: "merge", // remove to replace all query params by provided
                });
            }
        }
    }

}
