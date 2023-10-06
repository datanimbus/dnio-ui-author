import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { switchMap } from 'rxjs/operators';
import { App } from 'src/app/models/app';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-b2b-settings',
  templateUrl: './b2b-settings.component.html',
  styleUrls: ['./b2b-settings.component.scss']
})
export class B2bSettingsComponent implements OnInit {

  @ViewChild('startStopServiceModalTemplate') startStopServiceModalTemplate: TemplateRef<HTMLElement>;
  startStopServiceModalRef: NgbModalRef;
  startStopServiceModal: any;
  serviceStatus: any = {};
  appData: App;
  oldData: App;
  showLazyLoader: boolean;
  constructor(
    private commonService: CommonService,
    private ts: ToastrService,
    private appService: AppService
  ) {
    this.startStopServiceModal = {};
  }

  ngOnInit(): void {
    this.getManagementDetails();
    this.fetchApp();
  }

  getManagementDetails() {
    this.commonService.get('partnerManager', `/${this.commonService.app._id}/flow/utils/status/count`, { filter: { app: this.commonService.app._id } }).subscribe(res => {
      this.serviceStatus = res;
    }, (err) => {
      this.ts.warning(err.error.message);
    });
  }

  startStopServiceModel(value) {
    this.startStopServiceModal.title = `${value} all Services`
    this.startStopServiceModal.message = `Do you want to ${value} all services ?`
    this.startStopServiceModalRef = this.commonService.modal(this.startStopServiceModalTemplate);
    this.startStopServiceModalRef.result.then((close) => {
      if (close) {
        this.updateServicesState(value)
      }
    }, dismiss => { });

  }

  updateServicesState(value) {
    let endpoint = value == 'Start' ? 'startAll' : 'stopAll'
    this.commonService.put('partnerManager', `/${this.commonService.app._id}/flow/utils/${endpoint}`, { app: this.commonService.app._id }).subscribe(res => {
      this.ts.info(`${value} all process initiated !`)
      this.getManagementDetails();
    });
  }


  addMasking() {
    this.appData.maskingPaths.push({ maskType: 'all' });
  }

  removeMasking(index: number) {
    this.appData.maskingPaths.splice(index, 1);
  }

  fetchApp() {
    this.showLazyLoader = true;
    this.commonService.get('user', '/data/app/' + this.commonService.app._id, { noApp: true }).subscribe(res => {
      this.showLazyLoader = false;
      this.appData = res[0];
      if (!this.appData.maskingPaths) {
        this.appData.maskingPaths = [];
      }
      this.oldData = this.appService.cloneObject(this.appData);

      this.maskingPaths = (this.appData.maskingPaths || []);
    }, err => {
      this.showLazyLoader = false;
    });
  }

  saveApp() {
    this.appData.maskingPaths = this.maskingPaths;
    this.commonService.put('user', '/data/app/' + this.appData._id, this.appData).subscribe(res => {
      this.oldData = this.appService.cloneObject(this.appData);
      this.ts.success('Configuration saved successfully');
      this.commonService.appUpdates.emit(this.appData);
      this.commonService.app = res;
    }, err => {
      this.commonService.errorToast(err);
    });
  }

  get changesDone() {
    if (JSON.stringify(this.appData) === JSON.stringify(this.oldData)) {
      return false;
    } else {
      return true;
    }
  }

  get maskingPaths() {
    if (this.appData && this.appData.maskingPaths) {
      return this.appData.maskingPaths;
    }
    return [];
  }

  set maskingPaths(val: any) {
    if (this.appData) {
      this.appData.maskingPaths = val;
    }
  }
}
