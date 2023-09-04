import { Component, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { switchMap } from 'rxjs/operators';
import * as _ from 'lodash';

import { Breadcrumb } from 'src/app/utils/interfaces/breadcrumb';
import { CommonFilterPipe } from 'src/app/utils/pipes/common-filter/common-filter.pipe';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-plugins-listing',
  templateUrl: './plugins-listing.component.html',
  styleUrls: ['./plugins-listing.component.scss'],
  providers: [CommonFilterPipe]
})
export class PluginsListingComponent {

  pluginList: Array<any> = [];
  alertModal: {
    statusChange?: boolean;
    title: string;
    message: string;
    index: number;
  };
  showLazyLoader: boolean;
  subscriptions: any = {};
  breadcrumbPaths: Array<Breadcrumb>;
  openDeleteModal: EventEmitter<any>;
  form: UntypedFormGroup;
  showNewPluginWindow: boolean;
  showOptionsDropdown: any;
  selectedItemEvent: any
  selectedPlugin: any;
  searchTerm: string;
  sortModel: any;
  cloneData: any;
  isClone: boolean;
  dataType: string;
  showTextarea: string;
  definition: Array<any>;
  constructor(private commonService: CommonService,
    private appService: AppService,
    private router: Router,
    private fb: UntypedFormBuilder,
    private ts: ToastrService,
    private commonPipe: CommonFilterPipe) {
    this.alertModal = {
      statusChange: false,
      title: '',
      message: '',
      index: -1
    };
    this.breadcrumbPaths = [{
      active: true,
      label: 'Data Plugins'
    }];
    this.definition = [];

    this.commonService.changeBreadcrumb(this.breadcrumbPaths)
    this.openDeleteModal = new EventEmitter();
    this.form = this.fb.group({
      name: [null, [Validators.required, Validators.maxLength(40), Validators.pattern(/^[a-zA-Z]/)]],
      description: [null, [Validators.maxLength(240), Validators.pattern(/^[a-zA-Z]/)]],
      type: ['PROCESS', [Validators.required]],
    });
    this.showOptionsDropdown = {};
    this.showLazyLoader = true;
    this.sortModel = {};
    this.pluginList = this.appService.getFormatTypeList();
  }

  ngOnInit() {
    this.showLazyLoader = true;
    this.commonService.apiCalls.componentLoading = false;
    this.getPlugins();
    this.subscriptions['changeApp'] = this.commonService.appChange.subscribe(_app => {
      this.commonService.apiCalls.componentLoading = false;
      this.showLazyLoader = true;
      this.getPlugins();
    });

  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach(e => {
      this.subscriptions[e].unsubscribe();
    });
  }

  newPlugin() {
    this.form.reset({ type: 'PROCESS' });
    this.showNewPluginWindow = true;
  }

  triggerPluginCreate() {
    if (this.form.invalid) {
      return;
    }
    const payload = this.form.value;
    payload.app = this.commonService.app._id;
    payload.definition = this.definition;
    if (this.dataType) {
      payload.type = this.dataType;
    }
    this.showLazyLoader = true;
    this.commonService.post('partnerManager', `/${this.commonService.app._id}/plugin`, payload).subscribe(res => {
      this.ts.success('Plugin Created.');
      this.appService.edit = res._id;
      this.showLazyLoader = false;
      this.router.navigate(['/app/', this.commonService.app._id, 'plugin', res._id]);
    }, err => {
      this.showLazyLoader = false;
      this.commonService.errorToast(err);
    });
  }

  editPlugin(_index) {
    this.appService.edit = this.pluginList[_index]._id;
    this.router.navigate(['/app/', this.app, 'plugin', this.appService.edit]);
  }

  clonePlugin(_index) {
    this.appService.cloneLibraryId = this.records[_index]._id;
    this.cloneData = this.records[_index];
    this.isClone = true;
    this.form.patchValue({
      name: this.cloneData.name + ' Copy',
      pluginType: this.cloneData.pluginType,
      excelType: this.cloneData.excelType
    });
    this.showNewPluginWindow = true;
  }

  triggerPluginClone() {
    this.isClone = false;
    const payload = {
      name: this.form.value.name,
      pluginType: this.form.value.pluginType,
      excelType: this.form.value.excelType,
      app: this.cloneData.app,
      attributeCount: this.cloneData.attributeCount,
      character: this.cloneData.character,
      definition: this.cloneData.definition,
      lineSeparator: this.cloneData.lineSeparator,
      strictValidation: this.cloneData.strictValidation
    };
    this.showLazyLoader = true;
    this.commonService.post('partnerManager', `/${this.commonService.app._id}/plugin`, payload).subscribe(res => {
      this.ts.success('Plugin Cloned.');
      this.appService.edit = res._id;
      this.router.navigate(['/app/', this.commonService.app._id, 'plugin', res._id]);
      this.showLazyLoader = false;
    }, err => {
      this.showLazyLoader = false;
      this.commonService.errorToast(err);
    });
  }

  getPlugins() {
    if (this.subscriptions['getPlugins']) {
      this.subscriptions['getPlugins'].unsubscribe();
    }
    this.showLazyLoader = true;
    this.pluginList = [];
    this.subscriptions['getPlugins'] = this.commonService.get('partnerManager', `/${this.commonService.app._id}/plugin?countOnly=true`)
      .pipe(switchMap((ev: any) => {
        return this.commonService.get('partnerManager', `/${this.commonService.app._id}/plugin`, { count: ev });
      }))
      .subscribe(res => {
        this.showLazyLoader = false;
        if (res.length > 0) {
          res.forEach(item => {
            this.pluginList.push(item);
          });
        }
      }, err => {
        this.commonService.errorToast(err, 'We are unable to fetch records, please try again later');
      });
  }

  deletePlugin(_index) {
    this.alertModal.statusChange = false;
    this.alertModal.title = 'Delete plugin';
    this.alertModal.message = 'Are you sure you want to delete <span class="text-delete font-weight-bold">'
      + this.pluginList[_index].name + '</span> Plugin?';
    this.alertModal.index = _index;
    this.openDeleteModal.emit(this.alertModal);
  }

  closeDeleteModal(data) {
    if (data) {
      const url = `/${this.commonService.app._id}/plugin/` + this.pluginList[data.index]._id;
      this.showLazyLoader = true;
      this.subscriptions['deletePlugin'] = this.commonService.delete('partnerManager', url).subscribe(_d => {
        this.showLazyLoader = false;
        this.ts.info(_d.message ? _d.message : 'Plugin deleted');
        this.getPlugins();
      }, err => {
        this.showLazyLoader = false;
        this.commonService.errorToast(err, 'Unable to delete, please try again later');
      });
    }
  }

  hasPermissionForPlugin(id: string) {
    if (this.commonService.isAppAdmin || this.commonService.userDetails.isSuperAdmin) {
      return true;
    } else {
      const list = this.commonService.getEntityPermissions('PLUGIN_' + id);
      if (list.length > 0 && list.find(e => e.id === 'PNPL')) {
        return false;
      } else if (list.length === 0 && !this.hasManagePermission('PLUGIN') && !this.hasViewPermission('PLUGIN')) {
        return false;
      } else {
        return true;
      }
    }
  }

  canEditPlugin(id: string) {
    if (this.commonService.isAppAdmin || this.commonService.userDetails.isSuperAdmin) {
      return true;
    } else {
      const list = this.commonService.getEntityPermissions('PLUGIN_' + id);
      if (list.length > 0 && list.find(e => e.id === 'PMPL')) {
        return true;
      } else if (list.length === 0 && this.hasManagePermission('PLUGIN')) {
        return true;
      } else {
        return false;
      }
    }
  }

  hasManagePermission(entity: string) {
    return this.commonService.hasPermission('PMPL', entity);
  }
  hasViewPermission(entity: string) {
    return this.commonService.hasPermission('PVPL', entity);
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
    this.selectedPlugin = this.pluginList[i];
    this.showOptionsDropdown[i] = true;
  }

  selectPlugin(plugin: any) {
    this.pluginList.forEach(e => {
      e.selected = false;
    });
    plugin.selected = true;
    this.form.get('pluginType').patchValue(plugin.pluginType);
    if (plugin.pluginType === 'EXCEL') {
      this.form.get('excelType').patchValue(plugin.excelType);
    }
  }

  isPluginSelected(plugin: any) {
    const pluginType = this.form.get('pluginType').value;
    const excelType = this.form.get('excelType').value;
    let flag = false;
    if (plugin.pluginType == pluginType) {
      if (plugin.pluginType === 'EXCEL') {
        if (plugin.excelType == excelType) {
          flag = true;
        }
      } else {
        flag = true;
      }
    }
    return flag;
  }

  navigate(plugin: any) {
    this.router.navigate(['/app/', this.app, 'plugin', plugin._id])
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
    let records = this.commonPipe.transform(this.pluginList, 'name', this.searchTerm);
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
