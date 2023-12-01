import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { App } from 'src/app/models/app';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-faas-settings',
  templateUrl: './faas-settings.component.html',
  styleUrls: ['./faas-settings.component.scss']
})
export class FaasSettingsComponent implements OnInit {

  @ViewChild('startStopServiceModalTemplate') startStopServiceModalTemplate: TemplateRef<HTMLElement>;
  startStopServiceModalRef: NgbModalRef;
  startStopServiceModal: any;
  serviceStatus: any = {};
  appData: App;
  oldData: App;

  constructor(
    private commonService: CommonService,
    private ts: ToastrService,
    private appService: AppService
  ) {
    const self = this;
    // self.appData = {};
    // self.oldData = {};
    self.startStopServiceModal = {};
  }

  ngOnInit(): void {
    const self = this;
    console.log("exicuted")
    self.getManagementDetails();
  }

  getManagementDetails() {
    const self = this;
    self.commonService.get('partnerManager', `/${this.commonService.app._id}/faas/utils/status/count`, { filter: { app: this.commonService.app._id } }).subscribe(res => {
      self.serviceStatus = res;
    }, (err) => {
      self.ts.warning(err.error.message);
    });
  }

  startStopServiceModel(value) {
    const self = this;
    self.startStopServiceModal.title = `${value} all Services`
    self.startStopServiceModal.message = `Do you want to ${value} all services ?`
    self.startStopServiceModalRef = self.commonService.modal(self.startStopServiceModalTemplate);
    self.startStopServiceModalRef.result.then((close) => {
      if (close) {
        self.updateServicesState(value)
      }
    }, dismiss => { });

  }

  updateServicesState(value) {
    const self = this;
    let endpoint = value == 'Start' ? 'startAll' : 'stopAll'
    self.commonService.put('partnerManager', `/${this.commonService.app._id}/faas/utils/${endpoint}`, { app: this.commonService.app._id }).subscribe(res => {
      self.ts.info(`${value} all process initiated !`)
      self.getManagementDetails();
    })

  }

  get changesDone() {
    const self = this;
    if (JSON.stringify(self.appData) === JSON.stringify(self.oldData)) {
      return false;
    } else {
      return true;
    }
  }
}
