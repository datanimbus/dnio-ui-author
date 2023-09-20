import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-plugins-manage',
  templateUrl: './plugins-manage.component.html',
  styleUrls: ['./plugins-manage.component.scss']
})
export class PluginsManageComponent {
  alertModal: {
    statusChange?: boolean;
    title: string;
    message: string;
    index: number;
  };
  subscriptions: any;
  showLazyLoader: boolean;
  searchTerm: string;
  toggleExpand: boolean;
  params: Array<any>;
  selectedPlugin: any;
  edit: any;
  constructor(public commonService: CommonService,
    private appService: AppService,
    private ts: ToastrService,
    private route: ActivatedRoute,
    private router: Router) {
    this.alertModal = {
      statusChange: false,
      title: '',
      message: '',
      index: -1,
    };
    this.showLazyLoader = true;
    this.params = [];
    this.subscriptions = {};
    this.edit = {
      status: false
    };
  }
  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params.id) {
        if (this.appService.edit) {
          this.edit.editClicked = true;
          this.appService.edit = null;
          this.edit.status = true;
          this.edit.id = params.id;
        }
        this.getPlugin(params.id);
      }
    });
    this.commonService.apiCalls.componentLoading = false;
  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach(e => {
      this.subscriptions[e].unsubscribe();
    });
  }

  getPlugin(pluginId: string) {
    this.showLazyLoader = true;
    if (this.subscriptions['getPlugin']) {
      this.subscriptions['getPlugin'].unsubscribe();
    }
    this.subscriptions['getPlugin'] = this.commonService.get('partnerManager', `/${this.commonService.app._id}/plugin/${pluginId}`).subscribe((res: any) => {
      this.showLazyLoader = false;
      this.selectedPlugin = res;
      this.params = this.selectedPlugin.params || [];
    }, err => {
      this.showLazyLoader = false;
      console.log(err);
      this.commonService.errorToast(err);
    });
  }

  hasPermission(type: string, entity?: string) {
    return this.commonService.hasPermission(type, entity);
  }
  hasWritePermission(entity: string) {
    return this.commonService.hasPermission('PMPN', entity);
  }

  enableEditing() {
    this.edit.status = true;
    this.getPlugin(this.selectedPlugin._id);
    this.appService.updateCodeEditorState.emit();
  }

  cancel() {
    if (!this.edit.status || this.edit.editClicked || !this.edit.id) {
      this.router.navigate(['/app', this.commonService.app._id, 'plugin']);
    } else {
      if (!this.edit.editClicked) {
        this.edit.status = false;
        this.getPlugin(this.edit.id);
      }
    }
  }

  savePlugin() {
    this.selectedPlugin.params = this.params;
    const url = `/${this.commonService.app._id}/plugin/` + this.selectedPlugin._id;
    this.showLazyLoader = true;
    this.commonService
      .put('partnerManager', url, this.selectedPlugin)
      .subscribe(
        (d) => {
          this.showLazyLoader = false;
          this.ts.success('Plugin Saved Successfully');
          if (!this.edit.editClicked) {
            this.edit.status = false;
          } else {
            this.router.navigate(['/app', this.commonService.app._id, 'plugin']);
          }
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

  addParam() {
    this.params.push({ htmlType: 'input', dataType: 'text' });
  }

  removeParam(index: number) {
    this.params.splice(index, 1);
  }

  convertToKey(value: string, item: any) {
    item.key = this.appService.toCamelCase(value);
  }

  get app() {
    return this.commonService.app._id;
  }

  get isInvalid() {
    if (!this.selectedPlugin) {
      return true;
    }
    if (!this.selectedPlugin.name || !this.selectedPlugin.name.trim()) {
      return true;
    }
    if (!this.selectedPlugin.type || !this.selectedPlugin.type.trim()) {
      return true;
    }
    return false;
  }
}
