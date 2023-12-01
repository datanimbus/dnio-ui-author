import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  EventEmitter,
  TemplateRef,
} from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';

import {
  CommonService,
  GetOptions,
} from 'src/app/utils/services/common.service';
import { environment } from 'src/environments/environment';
import { AppService } from 'src/app/utils/services/app.service';
import { Breadcrumb } from 'src/app/utils/interfaces/breadcrumb';
@Component({
  selector: 'odp-service-manager',
  template: '<div></div>',
  styleUrls: ['./service-manager.component.scss'],
})
export class ServiceManagerComponent implements OnInit, OnDestroy {

  @ViewChild('alertModalTemplate', { static: false })
  alertModalTemplate: TemplateRef<HTMLElement>;
  app: string;
  serviceSearchForm: UntypedFormGroup;
  serviceList: Array<any> = [];
  service: GetOptions;
  alertModal: {
    statusChange?: boolean;
    title: string;
    message: string;
    index: number;
  };
  showLazyLoader = true;
  changeAppSubscription: any;
  showCardMenu: any = {};
  showCardDraft: any = {};
  subscriptions: any = {};
  showAddButton: boolean;
  breadcrumbPaths: Array<Breadcrumb>;
  openDeleteModal: EventEmitter<any>;
  form: UntypedFormGroup;
  cloneForm: UntypedFormGroup;
  alertModalTemplateRef: NgbModalRef;
  cloneData: any;
  easterEggEnabled: boolean;
  serviceRecordCounts: Array<any>;
  toggleImportWizard: boolean;
  frameworkComponents: any;
  showNewServiceWindow: boolean;
  showCloneServiceWindow: boolean;
  showYamlWindow: boolean;
  selectedService: any;
  copied: any;
  searchTerm: string;
  constructor(
    public commonService: CommonService,
    private appService: AppService,
    private router: Router,
    private fb: UntypedFormBuilder,
    private ts: ToastrService
  ) {
    this.serviceSearchForm = this.fb.group({
      searchTerm: ['', [Validators.required]],
      searchField: ['name', [Validators.required]],
    });
    this.breadcrumbPaths = [{
      active: true,
      label: 'Data Services',
      url: null
    }];
    this.commonService.changeBreadcrumb(this.breadcrumbPaths)
    this.alertModal = {
      statusChange: false,
      title: '',
      message: '',
      index: -1,
    };
    this.openDeleteModal = new EventEmitter();
    this.form = this.fb.group({
      name: [
        null,
        [
          Validators.required,
          Validators.maxLength(40),
          Validators.pattern(/\w+/),
        ],
      ],
      description: [
        null,
        [Validators.maxLength(240), Validators.pattern(/\w+/)],
      ],
    });
    this.cloneForm = this.fb.group({
      name: [
        null,
        [
          Validators.required,
          Validators.maxLength(40),
          Validators.pattern(/\w+/),
        ],
      ],
      description: [
        null,
        [Validators.maxLength(240), Validators.pattern(/\w+/)],
      ],
      desTab: [true],
      intTab: [false],
      expTab: [false],
      rolTab: [false],
      setTab: [false],
    });
    this.serviceRecordCounts = [];
    window['imadeveloper'] = () => {
      this.easterEggEnabled = true;
      this.ts.success('You are Developer!');
      setTimeout(() => {
        Object.keys(this.showCardMenu).forEach((key) => {
          this.showCardMenu[key] = true;
        });
      }, 200);
      setTimeout(() => {
        Object.keys(this.showCardMenu).forEach((key) => {
          this.showCardMenu[key] = false;
        });
      }, 3000);
    };
    this.copied = {};
    this.selectedService = {};
  }

  ngOnInit() {
    this.app = this.commonService.app._id;
    this.showLazyLoader = true;
    this.resetSearch();
    this.getServices();
    this.commonService.apiCalls.componentLoading = false;
    this.subscriptions['entity.delete'] =
      this.commonService.entity.delete.subscribe((data) => {
        const index = this.serviceList.findIndex((s) => {
          if (s._id === data._id) {
            return s;
          }
        });
        this.ts.success('Deleted ' + this.serviceList[index].name + '.');
        if (index > -1) {
          this.serviceList.splice(index, 1);
        }
      });
    this.subscriptions['entity.status'] =
      this.commonService.entity.status.subscribe((data) => {
        const index = this.serviceList.findIndex((s) => {
          if (s._id === data._id) {
            return s;
          }
        });
        if (index === -1) {
          return;
        }
        if (data.message === 'Undeployed') {
          this.ts.success('Stopped ' + this.serviceList[index].name + '.');
        } else if (data.message === 'Deployed') {
          this.ts.success('Started ' + this.serviceList[index].name + '.');
        } else if (data.message === 'Pending') {
          this.serviceList[index].status = 'Pending';
        }
        this.getLatestRecord(this.serviceList[index], index);
      });
    this.subscriptions['entity.new'] = this.commonService.entity.new.subscribe(
      (data) => {
        const index = this.serviceList.findIndex((s) => {
          if (s._id === data._id) {
            return s;
          }
        });
        if (index > -1) {
          this.serviceList[index].status = 'Active';
        } else {
          this.commonService
            .get(
              'serviceManager',
              `/${this.commonService.app._id}/service/` + data._id,
              { filter: { app: this.commonService.app._id } }
            )
            .subscribe(
              (service) => {
                // this.setServiceDetails(service);
                // this.serviceList.push(service);
              },
              (err) => {
                this.commonService.errorToast(err);
              }
            );
        }
      }
    );

    this.changeAppSubscription = this.commonService.appChange.subscribe(
      (_app) => {
        this.app = this.commonService.app._id;
        this.showLazyLoader = true;
        this.commonService.apiCalls.componentLoading = false;
        this.serviceList = [];
        this.resetSearch();
        this.getServices();
      }
    );
    // this.form.get('name').valueChanges.subscribe(_val => {
    //     this.form.controls.api.patchValue('/' + _.camelCase(_val));
    //     this.form.get(['definition', 0, '_id', 'prefix']).patchValue(_.toUpper(_.camelCase(_val.substring(0, 3))));
    //     this.form.get(['definition', 0, '_id', 'counter']).patchValue(1001);
    // });
  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach((e) => {
      this.subscriptions[e].unsubscribe();
    });
    if (this.alertModalTemplateRef) {
      this.alertModalTemplateRef.close();
    }
  }


  get isAppAdmin() {
    return this.commonService.isAppAdmin;
  }

  get isSuperAdmin() {
    return this.commonService.userDetails.isSuperAdmin;
  }

  newService() {
    this.form.reset({ name: this.searchTerm });
    this.showNewServiceWindow = true;
  }

  viewService(selectedRow) {
    this.router.navigate(['/app', this.app, 'sb', this.serviceList[selectedRow]._id]);
  }

  discardDraft(id: string) {
    const service = this.serviceList.find((e) => e._id === id);
    const serviceIndex = this.serviceList.findIndex((e) => e._id === id);
    this.alertModal = {
      title: 'Discard Draft',
      message: 'Are you sure you want to discard draft version?',
      index: 1,
    };
    this.alertModalTemplateRef = this.commonService.modal(
      this.alertModalTemplate,
      { size: 'sm' }
    );
    this.alertModalTemplateRef.result.then(
      (close) => {
        if (close) {
          let request;
          if (service.status === 'Draft') {
            request = this.commonService.delete(
              'serviceManager',
              `/${this.commonService.app._id}/service/` + id
            );
          } else {
            request = this.commonService.delete(
              'serviceManager',
              `/${this.commonService.app._id}/service/utils/${id}/draftDelete`
            );
          }
          request.subscribe(
            (res) => {
              Object.keys(this.showCardDraft).forEach((key) => {
                this.showCardDraft[key] = false;
              });
              this.ts.success('Draft Deleted.');
              if (service.status !== 'Draft') {
                this.router.navigate([
                  '/app/',
                  this.commonService.app._id,
                  'sb',
                  id,
                ]);
              } else {
                if (serviceIndex > -1) {
                  this.serviceList.splice(serviceIndex, 1);
                }
              }
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

  triggerServiceCreate() {
    const payload = this.form.value;
    payload.app = this.commonService.app._id;
    this.showLazyLoader = true;
    payload.versionValidity = this.commonService.app.serviceVersionValidity;
    if (!this.hasPermission('PMDSSDH', 'SM')) {
      delete payload.versionValidity;
    }
    this.commonService
      .post('serviceManager', `/${this.commonService.app._id}/service`, payload)
      .subscribe(
        (res) => {
          this.ts.success('Service Created.');
          this.appService.editServiceId = res._id;
          this.showLazyLoader = false;

          this.router.navigate([
            '/app/',
            this.commonService.app._id,
            'sb',
            res._id,
          ]);
        },
        (err) => {
          this.showLazyLoader = false;
          this.commonService.errorToast(err);
        }
      );
  }

  editService(index: number) {
    // if (
    //   (this.serviceList[index].status === 'Draft' ||
    //     this.serviceList[index].draftVersion) &&
    //   !this.showCardDraft[index]
    // ) {
    //   this.showCardDraft[index] = true;
    //   return;
    // }
    this.appService.editServiceId = this.serviceList[index]._id;
    this.router.navigate([
      '/app/',
      this.commonService.app._id,
      'sb',
      this.appService.editServiceId,
    ]);
  }

  repairService(index: number) {
    const url =
      `/${this.commonService.app._id}/service/utils/` +
      this.serviceList[index]._id +
      '/repair';
    this.subscriptions['updateservice'] = this.commonService
      .put('serviceManager', url, null)
      .subscribe(
        (d) => {
          this.ts.info('Repairing data service...');
          this.serviceList[index].status = 'Pending';
        },
        (err) => {
          this.commonService.errorToast(err);
        }
      );
  }

  getYamls(index: number) {
    this.selectedService = this.serviceList[index];
    if (!this.selectedService.serviceYaml || !this.selectedService.deploymentYaml) {
      const url = `/${this.commonService.app._id}/service/utils/${this.selectedService._id}/yamls`;
      this.subscriptions['updateservice'] = this.commonService
        .get('serviceManager', url, null)
        .subscribe(
          (data) => {
            this.selectedService.serviceYaml = data.service;
            this.selectedService.deploymentYaml = data.deployment;
            this.showYamlWindow = true;
          },
          (err) => {
            this.commonService.errorToast(err);
          }
        );
    } else {
      this.showYamlWindow = true;
    }
  }

  closeYamlWindow() {
    this.showYamlWindow = false;
    this.selectedService = null;
  }

  downloadYamls() {
    this.appService.downloadText(this.selectedService.name + '.yaml', this.selectedService.serviceYaml + '\n---\n' + this.selectedService.deploymentYaml);
  }

  copyText(text: string, type: string) {
    this.appService.copyToClipboard(text);
    this.copied[type] = true;
    setTimeout(() => {
      this.copied[type] = false;
    }, 2000);
  }

  cloneService(index: number) {
    this.cloneForm.reset({ desTab: true });
    this.cloneData = this.serviceList[index];
    this.cloneForm.get('name').patchValue(this.cloneData.name + ' Copy');
    this.cloneForm.get('description').patchValue(this.cloneData.description);
    this.showCloneServiceWindow = true;
  }

  triggerClone() {
    const payload = this.cloneForm.value;
    payload.app = this.commonService.app._id;
    if (payload.desTab) {
      payload.definition = this.cloneData.definition;
    }
    payload.schemaFree = this.cloneData.schemaFree;
    if (payload.rolTab) {
      payload.role = this.cloneData.role;
      if (payload.role && payload.role.roles) {
        this.appService.fixPermissionIdsInRoles(payload.role.roles);
        payload.role.fields = this.appService.getDefaultFields(
          payload.role.roles.map((e) => e.id),
          payload.definition,
          {}
        );
      }
    }
    if (payload.expTab) {
      payload.wizard = this.cloneData.wizard;
      payload.stateModel = this.cloneData.stateModel;
      payload.workflowConfig = this.cloneData.workflowConfig;
      if (payload.workflowConfig && payload.workflowConfig.makerCheckers) {
        this.appService.fixPermissionIdsInWF(
          payload.workflowConfig.makerCheckers
        );
      }
    }
    if (payload.setTab) {
      payload.tags = this.cloneData.tags;
      payload.versionValidity = this.cloneData.versionValidity;
      payload.headers = this.cloneData.headers;
      payload.enableSearchIndex = this.cloneData.enableSearchIndex;
    }
    if (payload.intTab) {
      payload.preHooks = this.cloneData.preHooks;
      payload.webHooks = this.cloneData.webHooks;
      payload.workflowHooks = this.cloneData.workflowHooks;
    }
    delete payload.desTab;
    delete payload.intTab;
    delete payload.expTab;
    delete payload.rolTab;
    delete payload.setTab;
    this.commonService
      .post('serviceManager', `/${this.commonService.app._id}/service`, payload)
      .subscribe(
        (res) => {
          this.ts.success('Service Cloned.');
          this.appService.editServiceId = res._id;
          this.showCloneServiceWindow = false;
          this.router.navigate([
            '/app/',
            this.commonService.app._id,
            'sb',
            res._id,
          ]);
        },
        (err) => {
          this.commonService.errorToast(err);
        }
      );
  }

  loadMore(event) {
    if (event.target.scrollTop >= 244) {
      this.showAddButton = true;
    } else {
      this.showAddButton = false;
    }
    if (
      event.target.scrollTop + event.target.offsetHeight ===
      event.target.children[0].offsetHeight
    ) {
      this.service.page = this.service.page + 1;
      this.showLazyLoader = true;
      this.getServices();
    }
  }

  resetSearch() {
    this.searchTerm = null;
    this.serviceList = [];
    this.service = {
      page: 1,
      count: 30,
      select: null,
      filter: { app: this.commonService.app._id },
    };
  }

  getServices() {
    if (this.subscriptions['getservice']) {
      this.subscriptions['getservice'].unsubscribe();
    }
    this.showLazyLoader = true;
    this.subscriptions['getservice'] = this.commonService
      .get(
        'serviceManager',
        `/${this.commonService.app._id}/service`,
        this.service
      )
      .subscribe(
        (res) => {
          this.showLazyLoader = false;
          if (res.length > 0) {
            const len = this.serviceList.length;
            res.forEach((service, i) => {
              this.showCardMenu[len + i] = false;
              // if (service.definition || service.webHook || service.status === 'Draft') {
              this.setServiceDetails(service);
              // service['docapi'] = `${environment.url.doc}/?q=/api/a/sm/service/${service._id}/swagger/${service.app}${service.api}?app=${this.commonService.app._id}`;
              service.docapi = `${environment.url.doc}/?q=/api/a/sm/${service.app}/service/utils/${service._id}/swagger/${service.app}${service.api}`;
              service._records = 0;
              this.serviceList.push(service);
              // }
            });
            if (this.commonService.userDetails.verifyDeploymentUser) {
              this.getServicesWithDraftData();
            }
            this._getAllServiceRecords(res.map((e) => e._id)).subscribe(
              (counts: any) => {
                if (counts && counts.length > 0) {
                  this.serviceRecordCounts = counts;
                  this.serviceRecordCounts.forEach((item) => {
                    const temp = this.serviceList.find(
                      (e) => e._id === item._id
                    );
                    if (temp) {
                      temp._records = item.count;
                    }
                  });
                }
              },
              (err) => {
                this.commonService.errorToast(
                  err,
                  'We are unable to fetch Data Service documents count, please try again later'
                );
              }
            );
          }
        },
        (err) => {
          this.commonService.errorToast(
            err,
            'We are unable to fetch records, please try again later'
          );
        }
      );
  }

  getServicesWithDraftData() {
    if (this.subscriptions['getDraftservice']) {
      this.subscriptions['getDraftservice'].unsubscribe();
    }
    this.showLazyLoader = true;
    this.subscriptions['getDraftservice'] = this.commonService
      .get(
        'serviceManager',
        `/${this.commonService.app._id}/service` + '?draft=true',
        this.service
      )
      .subscribe((res) => {
        this.showLazyLoader = false;
        res.forEach((item) => {
          const index = this.serviceList.findIndex((e) => e._id === item._id);
          this.serviceList[index]._metadata.lastUpdatedBy =
            item._metadata.lastUpdatedBy;
        });
      });
  }
  openDocs(index) {
    const docsAPI = this.serviceList[index].docapi;
    window.open(docsAPI, '_blank');
  }

  setServiceDetails(service) {
    if (service.status === 'Undeployed') {
      service.status = 'Stopped';
    }
    if (service.definition) {
      service._attributes = service.definition.length - 1;
    } else {
      service._attributes = service.attributeCount;
    }
    service._references =
      service.relatedSchemas && service.relatedSchemas.incoming
        ? service.relatedSchemas.incoming.length
        : 0;
    service._preHooks = service.preHooks ? service.preHooks.length : 0;
    service._webHooks = service.webHooks
      ? service.webHooks.length + service._preHooks
      : 0 + service._preHooks;
    // service.docapi = `${environment.url.doc}/?q=/api/a/sm/service/${service._id}/swagger/${service.app}${service.api}?app=${this.commonService.app._id}`;
    service.docapi = `${environment.url.doc}/?q=/api/a/sm/${service.app}/service/utils/${service._id}/swagger/${service.app}${service.api}`;
  }

  _getServiceRecords(service) {
    this.subscriptions['getservicerecord_' + service._id] = this.commonService
      .get(
        'serviceManager',
        `/${this.commonService.app._id}/service/utils/count/${service._id}`,
        { filter: { app: this.commonService.app._id } }
      )
      .subscribe(
        (res) => {
          service._records = res;
        },
        (err) => {
          service._records = 0;
        }
      );
  }

  _getAllServiceRecords(serviceIds: Array<string>) {
    return this.commonService.get(
      'serviceManager',
      `/${this.commonService.app._id}/service/utils/all/count`,
      {
        serviceIds: serviceIds.join(','),
        filter: { app: this.commonService.app._id },
      }
    );
  }

  _getUpTime(lastUpdated) {
    lastUpdated = new Date(lastUpdated);
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const d = new Date(diff);
    let msg = '';
    msg += d.getUTCHours() ? d.getUTCHours() + 'h ' : '';
    msg += d.getUTCMinutes() ? d.getUTCMinutes() + 'm ' : '';
    msg += d.getUTCSeconds() ? d.getUTCSeconds() + 's' : '';
    return msg;
  }

  _getNoOfRecords(service) {
    const url = service.api + '/utils/count';
    this.subscriptions['getnoofrecord'] = this.commonService
      .get('apis', url)
      .subscribe(
        (res) => {
          service._records = res;
        },
        (err) => {
          service._records = 0;
        }
      );
  }

  search(value) {
    if (!value || !value.trim()) {
      return;
    }
    if (!this.service.filter) {
      this.service.filter = {};
    }
    this.searchTerm = value;
    this.service.filter.name = '/' + value.trim() + '/';
    this.serviceList = [];
    this.getServices();
  }

  deleteService(index) {
    this.alertModal.statusChange = false;
    this.alertModal.title = 'Delete Data Service?';
    this.alertModal.message =
      'Are you sure you want to delete this data service? This action will delete ' +
      'the design, settings and integration configuration for <span class="font-weight-bold text-delete">' +
      this.serviceList[index].name +
      '</span>. It is highly recommended that you take a backup of your data before doing this, as the delete cannot be be undone.';
    this.alertModal.index = index;
    this.openDeleteModal.emit(this.alertModal);
  }

  closeDeleteModal(data) {
    if (data) {
      const url =
        `/${this.commonService.app._id}/service/` +
        this.serviceList[data.index]._id;
      this.showLazyLoader = true;
      this.subscriptions['deleteservice'] = this.commonService
        .delete('serviceManager', url)
        .subscribe(
          (d) => {
            this.showLazyLoader = false;
            this.ts.info(d.message ? d.message : 'Deleting data service...');
            this.serviceList[data.index].status = 'Working';
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

  toggleServiceStatus(index: number) {
    this.alertModal.statusChange = true;

    if (this.serviceList[index].status === 'Active') {
      this.alertModal.title = 'Stop ' + this.serviceList[index].name + '?';
      this.alertModal.message =
        'Are you sure you want to stop this data service? Once stopped, "' +
        this.serviceList[index].name +
        '" will no longer appear in the App Center. This action will also stop the API.';
    } else {
      this.alertModal.title = 'Start ' + this.serviceList[index].name + '?';
      this.alertModal.message =
        'Are you sure you want to start this data service? Once started, "' +
        this.serviceList[index].name +
        '" will appear in the App Center for users to work with. This action will also start the API.';
    }
    this.alertModalTemplateRef = this.commonService.modal(
      this.alertModalTemplate
    );
    this.alertModalTemplateRef.result.then(
      (close) => {
        if (close) {
          let url =
            `/${this.commonService.app._id}/service/utils/` +
            this.serviceList[index]._id +
            '/start';
          if (this.serviceList[index].status === 'Active') {
            url =
              `/${this.commonService.app._id}/service/utils/` +
              this.serviceList[index]._id +
              '/stop';
          }
          this.subscriptions['updateservice'] = this.commonService
            .put('serviceManager', url, { app: this.commonService.app._id })
            .subscribe(
              (d) => {
                if (this.serviceList[index].status === 'Active') {
                  this.ts.info('Stopping data service...');
                } else {
                  this.ts.info('Starting data service...');
                }
                this.serviceList[index].status = 'Pending';
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

  deployService(index: number) {
    this.alertModal.statusChange = true;
    if (
      this.serviceList[index].status === 'Draft' ||
      this.serviceList[index].draftVersion
    ) {
      this.alertModal.title = 'Deploy ' + this.serviceList[index].name + '?';
      this.alertModal.message =
        'Are you sure you want to Deploy this data service? Once Deployed, "' +
        this.serviceList[index].name +
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
            `/${this.commonService.app._id}/service/utils/` +
            this.serviceList[index]._id +
            '/deploy';
          this.subscriptions['updateservice'] = this.commonService
            .put('serviceManager', url, { app: this.commonService.app._id })
            .subscribe(
              (d) => {
                this.ts.info('Deploying data service...');
                this.serviceList[index].status = 'Pending';
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

  showDeploy(index: number) {
    const srvc = this.serviceList[index];
    if (srvc.status === 'Draft' || srvc.draftVersion) {
      return true;
    }
    return false;
  }

  isDeploy(index) {
    return this.showDeploy(index) && this.canDeployService(this.serviceList[index]) && this.serviceList[index].type != 'internal'
  }


  isStartStopService(index) {
    return this.canStartStopService(this.serviceList[index]._id) &&
      this.serviceList[index].type != 'internal'
  }


  hasPermissionForService(id: string) {
    if (
      this.commonService.isAppAdmin ||
      this.commonService.userDetails.isSuperAdmin
    ) {
      return true;
    } else {
      if (
        this.commonService.hasPermissionStartsWith('PMDS', 'SM') ||
        this.commonService.hasPermissionStartsWith('PVDS', 'SM')
      ) {
        return true;
      } else {
        return false;
      }
    }
  }

  canCloneService(id: string) {
    if (
      this.commonService.isAppAdmin ||
      this.commonService.userDetails.isSuperAdmin
    ) {
      return true;
    } else {
      return (
        this.commonService.hasPermission('PMDSD', 'SM') &&
        this.commonService.hasPermission('PMDSBC', 'SM')
      );
    }
  }

  canCloneTab(tab: string, id: string) {
    if (
      this.commonService.isAppAdmin ||
      this.commonService.userDetails.isSuperAdmin
    ) {
      return true;
    } else {
      return (
        this.commonService.hasPermission('PMDS' + tab, 'SM') &&
        this.commonService.hasPermission('PMDSBC', 'SM')
      );
    }
  }

  canEditService(id: string) {
    if (
      this.commonService.isAppAdmin ||
      this.commonService.userDetails.isSuperAdmin
    ) {
      return true;
    } else {
      const list2 = this.commonService.getEntityPermissions('SM');
      return Boolean(
        list2.find(
          (e) =>
            e.id.startsWith('PMDS') &&
            e.id !== 'PMDSBC' &&
            e.id !== 'PMDSBD' &&
            e.id !== 'PMDSPD' &&
            e.id !== 'PMDSPS'
        )
      );
    }
  }

  canDeleteService(id: string) {
    if (
      this.commonService.isAppAdmin ||
      this.commonService.userDetails.isSuperAdmin
    ) {
      return true;
    } else {
      return this.commonService.hasPermission('PMDSBD', 'SM');
    }
  }

  canDeployService(service) {
    if (this.commonService.userDetails.isSuperAdmin) {
      return true;
    } else if (
      this.commonService.isAppAdmin &&
      !this.commonService.userDetails.verifyDeploymentUser
    ) {
      return true;
    } else if (
      this.commonService.userDetails.verifyDeploymentUser &&
      this.commonService.userDetails._id === service._metadata.lastUpdatedBy
    ) {
      return false;
    } else {
      return this.commonService.hasPermission('PMDSPD', 'SM');
    }
  }

  canStartStopService(id: string) {
    const temp = this.serviceList.find((e) => e._id === id);
    if (temp.status !== 'Stopped' && temp.status !== 'Active') {
      return false;
    }
    if (
      this.commonService.isAppAdmin ||
      this.commonService.userDetails.isSuperAdmin
    ) {
      return true;
    } else {
      return this.commonService.hasPermission('PMDSPS', 'SM');
    }
  }

  hasCreatePermission(entity: string) {
    return this.commonService.hasPermission('PMDSBC', entity);
  }

  getTooltipText(status: string) {
    if (status === 'Active') {
      return 'Running';
    }
    if (status === 'Stopped') {
      return 'Stopped';
    }
    if (status === 'Maintenance') {
      return 'Under maintenance';
    }
    if (status === 'Pending') {
      return 'Pending';
    }
    if (status === 'Draft') {
      return 'Draft';
    }
  }

  autoAdjust(ele: HTMLElement) {
    if (!ele.classList.contains('active')) {
      const hideOffset = ele.clientHeight - 32;
      ele.style.bottom = '-' + hideOffset + 'px';
    } else {
      ele.style.bottom = '0px';
    }
  }
  getLatestRecord(service, index) {
    const indx = this.serviceList.findIndex((s) => {
      if (s._id === service._id) {
        return s;
      }
    });
    if (indx > -1) {
      this.subscriptions['getservicerecord_' + service._id] = this.commonService
        .get(
          'serviceManager',
          `/${this.commonService.app._id}/service/` + service._id,
          { filter: { app: this.commonService.app._id } }
        )
        .subscribe(
          (res) => {
            this.setServiceDetails(res);
            this.serviceList.splice(index, 1, res);
            this.serviceRecordCounts.forEach((item) => {
              const temp = this.serviceList.find((e) => e._id === item._id);
              if (temp) {
                temp._records = item.count;
              }
            });
          },
          (err) => {
            console.error(err);
          }
        );
    }
  }

  hasPermission(type: string, entity?: string) {
    return this.commonService.hasPermission(type, entity);
  }

  transactionDoc() {
    const docsAPI = `${environment.url.doc}/?q=/api/a/common/txn`;
    window.open(docsAPI, '_blank');
  }

  getStatusClass(srvc) {
    if (srvc.status === 'Active') {
      return 'text-success';
    }
    if (srvc.status === 'Stopped') {
      return 'text-danger';
    }
    if (srvc.status === 'Draft') {
      return 'text-accent';
    }
    if (srvc.status === 'Pending') {
      return 'text-warning';
    }
    return 'text-secondary';
  }

  get isExperimental() {
    return this.commonService.userDetails.experimentalFeatures;
  }
}
