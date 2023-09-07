import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'odp-npm-libraries',
  templateUrl: './npm-libraries.component.html',
  styleUrls: ['./npm-libraries.component.scss']
})
export class NpmLibrariesComponent implements OnInit, OnDestroy {
  showLazyLoader: boolean;
  appData: any;
  constructor(private appService: AppService,
    private commonService: CommonService,
    private ts: ToastrService) {
    this.appData = {};
  }

  ngOnInit(): void {
    this.getApp(this.commonService.app._id);
  }

  ngOnDestroy(): void {

  }

  getApp(id: string) {
    this.showLazyLoader = true;
    this.commonService.get('user', '/data/app/' + id, { noApp: true }).subscribe(res => {
      this.showLazyLoader = false;
      if (Array.isArray(res)) {
        this.appData = Object.assign(this.appData, res[0]);
      } else {
        this.appData = Object.assign(this.appData, res);
      }
    }, err => {
      this.showLazyLoader = false;
    });
  }


  saveApp() {
    this.showLazyLoader = true;
    this.commonService.put('user', `/data/app/${this.appData._id}`, this.appData).subscribe(res => {
      this.showLazyLoader = false;
      this.ts.success('Configuration Details Saved!');
    }, err => {
      this.showLazyLoader = false;
      this.commonService.errorToast(err, 'Unable to Save Variable');
    });
  }

  get version() {
    return environment.version;
  }
}
