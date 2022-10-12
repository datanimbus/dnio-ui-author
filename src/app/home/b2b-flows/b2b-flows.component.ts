import { Component, OnInit, OnDestroy, EventEmitter, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { switchMap } from 'rxjs/operators';
import * as _ from 'lodash';
import * as uuid from 'uuid/v1';

import { GetOptions, CommonService } from 'src/app/utils/services/common.service';
import { AppService } from 'src/app/utils/services/app.service';
import { Breadcrumb } from 'src/app/utils/interfaces/breadcrumb';
import { CommonFilterPipe } from 'src/app/utils/pipes/common-filter/common-filter.pipe';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'odp-b2b-flows',
  templateUrl: './b2b-flows.component.html',
  styleUrls: ['./b2b-flows.component.scss'],
  providers: [CommonFilterPipe]
})
export class B2bFlowsComponent implements OnInit, OnDestroy {

  @ViewChild('alertModalTemplate', { static: false }) alertModalTemplate: TemplateRef<HTMLElement>;
  alertModalTemplateRef: NgbModalRef;
  form: FormGroup;
  apiConfig: GetOptions;
  flowList: Array<any>;
  alertModal: {
    statusChange?: boolean;
    title: string;
    message: string;
    index: number;
  };
  subscriptions: any;
  showNewFlowWindow: boolean;
  showLazyLoader: boolean;
  copied: any;
  showOptionsDropdown: any;
  selectedItemEvent: any
  selectedLibrary: any;
  sortModel: any;
  breadcrumbPaths: Array<Breadcrumb>;
  openDeleteModal: EventEmitter<any>;
  searchTerm: string;
  constructor(public commonService: CommonService,
    private appService: AppService,
    private router: Router,
    private ts: ToastrService,
    private fb: FormBuilder,
    private commonFilter: CommonFilterPipe) {
    this.subscriptions = {};
    this.form = this.fb.group({
      name: [null, [Validators.required, Validators.maxLength(40), Validators.pattern(/\w+/)]],
      description: [null, [Validators.maxLength(240), Validators.pattern(/\w+/)]],
      type: ['API'],
      inputNode: []
    });
    this.apiConfig = {
      page: 1,
      count: 30
    };
    this.flowList = [];
    this.alertModal = {
      statusChange: false,
      title: '',
      message: '',
      index: -1,
    };
    this.openDeleteModal = new EventEmitter();
    this.copied = {};
    this.showOptionsDropdown = {};
    this.showLazyLoader = true;
    this.sortModel = {};
    this.breadcrumbPaths = [{
      active: true,
      label: 'Flows'
    }];
  }
  ngOnInit() {
    this.getFlows();
    this.commonService.changeBreadcrumb(this.breadcrumbPaths);
    this.commonService.apiCalls.componentLoading = false;
    this.form.get('type').valueChanges.subscribe(val => {
      const name = this.form.get('name').value;
      this.form.get('inputNode').patchValue({
        _id: this.appService.getNodeID(),
        type: val,
        options: {
          method: 'POST',
          path: name ? _.camelCase(name) : null
        }
      });
    });
    this.form.get('name').valueChanges.subscribe(val => {
      let inputNode = this.form.get('inputNode').value;
      const type = this.form.get('type').value;
      if (!inputNode) {
        inputNode = {
          type: type ? type : 'API'
        };
      }
      inputNode.options = {
        method: 'POST',
        path: val ? '/' + _.camelCase(val) : null
      };
      this.form.get('inputNode').patchValue(inputNode);
    });
    this.subscriptions.appChange = this.commonService.appChange.subscribe(app => {
      this.getFlows()
    });
    this.subscriptions['flow.delete'] = this.commonService.flow.delete.subscribe(data => {
      this.getFlows()
    });
    this.subscriptions['flow.status'] = this.commonService.flow.status.subscribe(data => {
      this.getFlows()
    });
    this.subscriptions['flow.new'] = this.commonService.flow.new.subscribe(data => {
      this.getFlows()
    });
  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach(e => {
      this.subscriptions[e].unsubscribe();
    });
  }

  newFlow() {
    this.form.reset({ inputNode: { type: 'API' } });
    this.showNewFlowWindow = true;
  }

  triggerFlowCreate() {
    if (this.form.invalid) {
      return;
    }
    this.showLazyLoader = true;
    this.showNewFlowWindow = false;
    const payload = this.form.value;
    payload.app = this.commonService.app._id;
    payload.nodes = [];
    this.commonService.post('partnerManager', `/${this.commonService.app._id}/flow`, payload).subscribe(res => {
      this.showLazyLoader = false;
      this.form.reset({ type: 'API' });
      this.ts.success('Flow has been created.');
      this.appService.edit = res._id;
      this.router.navigate(['/app/', this.commonService.app._id, 'flow', res._id]);
    }, err => {
      this.showLazyLoader = false;
      this.form.reset({ type: 'API' });
      this.commonService.errorToast(err);
    });
  }

  getFlows() {
    this.showLazyLoader = true;
    this.flowList = [];
    return this.commonService.get('partnerManager', `/${this.commonService.app._id}/flow/utils/count`).pipe(switchMap((count: any) => {
      return this.commonService.get('partnerManager', `/${this.commonService.app._id}/flow`, {
        count: count,
        select: 'name inputNode status lastInvoked _metadata'
      });
    })).subscribe((res: any) => {
      this.showLazyLoader = false;
      res.forEach(item => {
        item.url = 'https://' + this.commonService.userDetails.fqdn + `/b2b/${this.app}` + item.inputNode.options.path;
        this.flowList.push(item);
      });
    }, err => {
      this.showLazyLoader = false;
      console.log(err);
      this.commonService.errorToast(err);
    });
  }


  getStatusClass(srvc) {
    if (srvc.status.toLowerCase() === 'active') {
      return 'text-success';
    }
    if (srvc.status.toLowerCase() === 'stopped' || srvc.status.toLowerCase() === 'undeployed') {
      return 'text-danger';
    }
    if (srvc.status.toLowerCase() === 'draft') {
      return 'text-accent';
    }
    if (srvc.status.toLowerCase() === 'pending') {
      return 'text-warning';
    }
    return 'text-secondary';
  }

  getStatusLabel(srvc) {
    if (srvc.status.toLowerCase() === 'stopped' || srvc.status.toLowerCase() === 'undeployed') {
      return 'Stopped';
    }
    return srvc.status;
  }



  canManageFlow(id: string) {
    if (this.commonService.isAppAdmin || this.commonService.userDetails.isSuperAdmin) {
      return true;
    } else {
      return this.hasPermission('PMF');
    }
  }

  canDeleteFlow(id: string) {
    return this.hasPermission('PMF');
  }

  canDeployFlow(flow) {
    if (!flow.draftVersion) {
      return false;
    }
    if (this.commonService.userDetails.isSuperAdmin) {
      return true;
    } else if (
      this.commonService.isAppAdmin &&
      !this.commonService.userDetails.verifyDeploymentUser
    ) {
      return true;
    } else if (
      this.commonService.userDetails.verifyDeploymentUser &&
      this.commonService.userDetails._id === flow._metadata.lastUpdatedBy
    ) {
      return false;
    } else {
      return this.commonService.hasPermission('PMFPD', 'FLOW');
    }
  }

  canStartStopFlow(id: string) {
    const temp = this.flowList.find((e) => e._id === id);
    if (temp && temp.status !== 'Stopped' && temp.status !== 'Active') {
      return false;
    }
    if (
      this.commonService.isAppAdmin ||
      this.commonService.userDetails.isSuperAdmin
    ) {
      return true;
    } else {
      return this.commonService.hasPermission('PMFPS', 'FLOW');
    }
  }

  hasPermission(type: string, entity?: string) {
    return this.commonService.hasPermission(type, entity);
  }
  hasWritePermission(entity: string) {
    return this.commonService.hasPermission('PMF', entity);
  }

  deployFlow(index: number) {
    this.alertModal.statusChange = true;
    if (
      this.flowList[index].status === 'Draft' ||
      this.flowList[index].draftVersion
    ) {
      this.alertModal.title = 'Deploy ' + this.flowList[index].name + '?';
      this.alertModal.message =
        'Are you sure you want to Deploy this function? Once Deployed, "' +
        this.flowList[index].name +
        '" will be running the latest version.';
    } else {
      return;
    }
    this.alertModalTemplateRef = this.commonService.modal(
      this.alertModalTemplate
    );
    this.alertModalTemplateRef.result.then(
      (close) => {
        if (close) {
          const url =
            `/${this.commonService.app._id}/flow/utils/` +
            this.flowList[index]._id +
            '/deploy';
          this.subscriptions['updateservice'] = this.commonService
            .put('partnerManager', url, { app: this.commonService.app._id })
            .subscribe(
              (d) => {
                this.ts.info('Deploying function...');
                this.flowList[index].status = 'Pending';
              },
              (err) => {
                this.commonService.errorToast(err);
              }
            );
        }
      },
      (dismiss) => { }
    );
  }

  toggleFlowStatus(index: number) {
    this.alertModal.statusChange = true;

    if (this.flowList[index].status === 'Active') {
      this.alertModal.title = 'Stop ' + this.flowList[index].name + '?';
      this.alertModal.message =
        'Are you sure you want to stop this function? : ' + this.flowList[index].name;
    } else {
      this.alertModal.title = 'Start ' + this.flowList[index].name + '?';
      this.alertModal.message =
        'Are you sure you want to start this function? : ' + this.flowList[index].name;
    }
    this.alertModalTemplateRef = this.commonService.modal(
      this.alertModalTemplate
    );
    this.alertModalTemplateRef.result.then(
      (close) => {
        if (close) {
          let url =
            `/${this.commonService.app._id}/flow/utils/` +
            this.flowList[index]._id +
            '/start';
          if (this.flowList[index].status === 'Active') {
            url =
              `/${this.commonService.app._id}/flow/utils/` +
              this.flowList[index]._id +
              '/stop';
          }
          this.subscriptions['updateservice'] = this.commonService
            .put('partnerManager', url, { app: this.commonService.app._id })
            .subscribe(
              (d) => {
                if (this.flowList[index].status === 'Active') {
                  this.ts.info('Stopping function...');
                } else {
                  this.ts.info('Starting function...');
                }
                this.flowList[index].status = 'Pending';
              },
              (err) => {
                this.commonService.errorToast(err);
              }
            );
        }
      },
      (dismiss) => { }
    );
  }

  closeDeleteModal(data) {
    if (data) {
      const url =
        `/${this.commonService.app._id}/flow/` +
        this.flowList[data.index]._id;
      this.showLazyLoader = true;
      this.subscriptions['deleteservice'] = this.commonService
        .delete('partnerManager', url)
        .subscribe(
          (d) => {
            this.showLazyLoader = false;
            this.ts.info(d.message ? d.message : 'Deleting flow...');
            this.flowList[data.index].status = 'Pending';
          },
          (err) => {
            this.showLazyLoader = false;
            this.commonService.errorToast(
              err,
              'Oops, something went wrong. Please try again later.'
            );
          }
        );
    }
  }

  editFlow(index: number) {
    this.appService.edit = this.flowList[index]._id;
    this.router.navigate(['/app/', this.commonService.app._id, 'flow', this.appService.edit,
    ]);
  }

  viewFlow(index: number) {
    this.router.navigate(['/app', this.commonService.app._id, 'flow', this.flowList[index]._id]);
  }

  deleteFlow(index: number) {
    this.alertModal.statusChange = false;
    this.alertModal.title = 'Delete Flow?';
    this.alertModal.message =
      'Are you sure you want to delete this flow? This action will delete : ' + this.flowList[index].name;
    this.alertModal.index = index;
    this.openDeleteModal.emit(this.alertModal);
  }

  cloneFlow(index: number) {
    this.form.reset();
    const temp = this.flowList[index];
    this.form.get('name').patchValue(temp.name + ' Copy');
    this.form.get('code').patchValue(temp.code);
    this.showNewFlowWindow = true;
  }

  copyUrl(flow: any) {
    this.copied[flow._id] = true;
    this.appService.copyToClipboard(flow.url);
    setTimeout(() => {
      this.copied[flow._id] = false;
    }, 2000);
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

  showDropDown(event: any, i: number) {
    this.selectedItemEvent = event;
    Object.keys(this.showOptionsDropdown).forEach(key => {
      this.showOptionsDropdown[key] = false;
    })
    this.selectedLibrary = this.flowList[i];
    this.showOptionsDropdown[i] = true;
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

  get records() {
    let records = this.commonFilter.transform(this.flowList, 'name', this.searchTerm);
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
        return this.compare(b._metadata.lastUpdated, a._metadata.lastUpdated);
      });
    }
    return records;
  }

  get app() {
    return this.commonService.app._id;
  }
}
