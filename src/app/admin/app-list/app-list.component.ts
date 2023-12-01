import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter,
  Input,
} from '@angular/core';
import {
  trigger,
  style,
  transition,
  animate,
  query,
  stagger,
  group,
} from '@angular/animations';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { App } from 'src/app/utils/interfaces/app';
import {
  CommonService,
  GetOptions,
} from 'src/app/utils/services/common.service';
import { FilterPipe } from 'src/app/utils/pipes/filter.pipe';
import { AppService } from 'src/app/utils/services/app.service';
import { UserDetails } from '../../definitions/userDetails';
import * as _ from 'lodash';
import { CommonFilterPipe } from 'src/app/utils/pipes/common-filter/common-filter.pipe';

@Component({
  selector: 'odp-app-list',
  templateUrl: './app-list.component.html',
  styleUrls: ['./app-list.component.scss'],
  animations: [
    trigger('listItems', [
      transition('* => *', [
        group([
          query('.app-card', [
            style({ transform: 'scale(0)' }),
            animate('200ms ease-in', style({ transform: 'scale(1)' })),
          ]),
          query(
            ':enter',
            [
              style({ transform: 'scale(0)' }),
              stagger('50ms ease-in', [
                animate('200ms ease-in', style({ transform: 'scale(1)' })),
              ]),
            ],
            { optional: true }
          ),
        ]),
        query(
          ':leave',
          [
            stagger('50ms', [
              animate('200ms ease-out', style({ transform: 'scale(0)' })),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
  providers: [FilterPipe, CommonFilterPipe],
})
export class AppListComponent implements OnInit, OnDestroy {

  @Input() isHome: boolean = false;
  @Input() navToApp: any;
  subscriptions: any;
  appList: Array<App>;
  apiConfig: GetOptions;
  errorMessage: string;
  createAppLoader: boolean;
  searchTerm: string;
  deleteModalRef: NgbModalRef;
  appIndex = -1;
  appOptions: any;
  openDeleteModal: EventEmitter<any>;
  alertModal: {
    statusChange?: boolean;
    title: string;
    message: string;
    _id: string;
    appIndex?: string;
  };
  showLazyLoader: boolean;
  form: UntypedFormGroup;
  timezones: Array<any>;
  userDetails: UserDetails;
  isSuperadmin: boolean;
  showNewAppWindow: boolean;
  showOptionsDropdown: any;
  selectedItemEvent: any;
  selectedService: any;
  sortModel: any;
  constructor(
    private commonService: CommonService,
    private appService: AppService,
    private router: Router,
    private fb: UntypedFormBuilder,
    private ts: ToastrService,
    private commonPipe:CommonFilterPipe,
    private appFilter: FilterPipe
  ) {
    const self = this;
    self.subscriptions = {};
    self.appList = [];
    self.apiConfig = {};
    self.searchTerm = '';
    self.openDeleteModal = new EventEmitter();
    self.alertModal = {
      statusChange: false,
      title: '',
      message: '',
      _id: null,
    };
    self.form = self.fb.group({
      _id: [
        null,
        [
          Validators.required,
          Validators.maxLength(40),
          Validators.pattern('[a-zA-z0-9_-]+'),
        ],
      ],
      defaultTimezone: [],
      description: [null],
      serviceVersionValidity: self.fb.group({
        validityType: ['count', [Validators.required]],
        validityValue: [-1, [Validators.required]],
      }),
    });
    this.timezones = this.appService.getTimezones();
    this.sortModel={};
    this.selectedService = {};
    this.showOptionsDropdown = {};
  }

  ngOnInit() {
    const self = this;
    self.appOptions = {};
    self.apiConfig.count = -1;
    self.apiConfig.select = 'name logo.thumbnail';
    self.apiConfig.noApp = true;
    self.apiConfig.sort = '_id';
    self.isSuperadmin =
      self.commonService.userDetails?.isSuperAdmin ||
      JSON.parse(localStorage.getItem('ba-user'))?.isSuperAdmin;
    self.isSuperadmin ? self.getApps() : self.getUserApps();
    if (this.commonService.userDetails && this.commonService.userDetails?.defaultTimezone) {
      this.form.get('defaultTimezone').patchValue(this.commonService.userDetails?.defaultTimezone);
    }
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach((e) => {
      self.subscriptions[e].unsubscribe();
    });
  }

  getApps() {
    const self = this;
    this.subscriptions['appList'] =  self.commonService.get('user', '/admin/app', self.apiConfig).subscribe(
      (res) => {
        self.appList = [];
        self.commonService.appList = [];
        res.forEach((item) => {
          item.firstLetter = item._id.charAt(0);
          item.bg = this.appColor();
          if (_.isEmpty(item.logo) || !item.logo.thumbnail) {
            delete item.logo;
          }
          self.appList.push(item);


          self.commonService.appList.push(item);

          if (self.navToApp) {
            this.useApp(this.navToApp._id)
          }
        });
      },
      (err) => {
        console.log(err);
      }
    );
  }

  getUserApps() {
    const self = this;
    this.subscriptions['userApps'] = self.commonService.get('user', '/data/app', self.apiConfig).subscribe(
      (res) => {
        self.appList = [];
        self.commonService.appList = [];
        res.forEach((item) => {
          item.firstLetter = item._id.charAt(0);
          item.bg = this.appColor();
          if (_.isEmpty(item.logo) || !item.logo.thumbnail) {
            delete item.logo;
          }
          self.appList.push(item);
          self.commonService.appList.push(item);

          if (self.navToApp) {
            this.useApp(this.navToApp._id)
          }
        });
        if (self.appList.length === 1) {
          this.useApp(self.appList[0]._id);
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  newApp() {
    const self = this;
    self.form.reset({
      _id: this.searchTerm,
      type: 'Management',
      serviceVersionValidity: {
        validityType: 'count',
        validityValue: -1,
      },
    });
    this.showNewAppWindow = true;
  }

  createApp() {
    const self = this;
    const payload: App = self.form.value;
    self.errorMessage = null;
    self.createAppLoader = true;
    self.showLazyLoader = true;
    self.commonService.post('user', '/admin/app', payload).subscribe(
      (res) => {
        self.createAppLoader = false;
        self.showNewAppWindow = false;
        self.commonService.appList.push(res);
        self.showLazyLoader = false;
        self.router.navigate(['/app', res._id, 'sm']);
      },
      (err) => {
        self.showLazyLoader = false;
        self.createAppLoader = false;
        self.errorMessage = err.error.message;
      }
    );
  }

  useApp(name: string) {
    const self = this;
    self.commonService.app = self.appList.find((e) => e._id === name);
    self.commonService.saveLastActiveApp();
    self.router.navigate(['/app', name]);
  }

  deleteApp(app: any, appIndex) {
    const self = this;
    self.alertModal.statusChange = false;
    self.alertModal.title = 'Delete App';
    self.alertModal.message =
      'Are you sure you want to delete app <span class="text-delete font-weight-bold">' +
      app._id +
      '</span>? This action will delete the entire app including all the data services within it. This action is undoable.';
    self.alertModal._id = app._id;
    self.alertModal.appIndex = appIndex;
    self.openDeleteModal.emit(self.alertModal);
  }

  closeDeleteModal(data) {
    const self = this;
    if (data) {
      const url = '/admin/app/' + data._id;
      self.showLazyLoader = true;
      self.subscriptions['deleteApp'] = self.commonService
        .delete('user', url, {noApp: true})
        .subscribe(
          (d) => {
            self.showLazyLoader = false;
            self.ts.success('App deleted successfully');
            self.appOptions[data.appIndex] = false;
            self.getApps();
          },
          (err) => {
            self.showLazyLoader = false;
            self.commonService.errorToast(
              err,
              'Unable to delete, please try again later'
            );
          }
        );
    }
  }

  enterToSelect(event: KeyboardEvent) {
    const self = this;
    if (self.searchTerm) {
      const returnedApps = self.appFilter.transform(
        self.appList,
        self.searchTerm
      );
      if (returnedApps.length > 0) {
        self.useApp(returnedApps[0]._id);
      }
    } else if (self.appList.length > 0) {
      self.useApp(self.appList[0]._id);
    }
  }

  get dummyRows() {
    const self = this;
    const arr = new Array(12);
    arr.fill(1);
    return arr;
  }

  getText(app) {
    console.log(app);
    return app.firstLetter;
  }

  appColor() {
    const colorArray = [
      '#B2DFDB',
      '#B2EBF2',
      '#B3E5FC',
      '#A5D6A7',
      '#C5E1A5',
      '#E6EE9C',
    ];
    return _.sample(colorArray);
  }

  private compare(a: any, b: any) {
    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    } else {
      return 0;
    }
  }

  applySort(field: string) {
    if (!this.sortModel[field]) {
      this.sortModel = {};
      this.sortModel[field] = 1;
    } else if (this.sortModel[field] == 1) {
      this.sortModel[field] = -1;
    } else {
      delete this.sortModel[field];
    }
  }

  get records() {
    let records = this.commonPipe.transform(this.appList, '_id', this.searchTerm);
    const field = Object.keys(this.sortModel)[0];
    if (field) {
      records = records.sort((a, b) => {
        if (this.sortModel[field] == 1) {
          if (typeof a[field] == 'number' || typeof b[field] == 'number') {
            return this.compare((a[field]), (b[field]));
          } else {
            return this.compare(_.lowerCase(a[field]), _.lowerCase(b[field]));
          }
        } else if (this.sortModel[field] == -1) {
          if (typeof a[field] == 'number' || typeof b[field] == 'number') {
            return this.compare((b[field]), (a[field]));
          } else {
            return this.compare(_.lowerCase(b[field]), _.lowerCase(a[field]));
          }
        } else {
          return 0;
        }
      });
    } else {
      records = records.sort((a, b) => {
        return this.compare(b._metadata?.lastUpdated, a._metadata?.lastUpdated);
      });
    }
    return records;
  }

  showDropDown(event: any, id: string) {
    this.selectedItemEvent = event;
    Object.keys(this.showOptionsDropdown).forEach(key => {
      this.showOptionsDropdown[key] = false;
    })
    this.selectedService = this.appList.find(e => e._id == id);
    this.showOptionsDropdown[id] = true;
  }

  get dropDownStyle() {
    let top = (this.selectedItemEvent.clientY + 10);
    if (this.selectedItemEvent.clientY > 430) {
      top = this.selectedItemEvent.clientY - 106
    }
    return {
      top: top + 'px',
      right: '50px'
    };
  }
}
