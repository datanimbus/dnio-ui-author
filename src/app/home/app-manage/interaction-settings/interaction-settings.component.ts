import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'odp-interaction-settings',
  templateUrl: './interaction-settings.component.html',
  styleUrls: ['./interaction-settings.component.scss']
})
export class InteractionSettingsComponent implements OnInit, OnDestroy {

  showLazyLoader: boolean;
  appData: any;
  connectorType: string;
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
      delete this.appData._metadata;
      delete this.appData.__v;
      if (!this.appData.interactionStore) {
        this.appData.interactionStore = {
          retainPolicy: {
            retainType: 'days',
            retainValue: -1
          },
          storeType: 'db',
          configuration: null
        };
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

  onStoreTypeChange(val: any) {
    if (!this.appData.interactionStore) {
      this.appData.interactionStore = {};
    }
    this.appData.interactionStore.storeType = val;
    this.appData.interactionStore.configuration = null;
    if (val == 'azureblob') {
      this.connectorType = 'AZBLOB';
    }
    if (val == 'awss3') {
      this.connectorType = 'S3';
    }
  }


  // selectConnector(item: NgbTypeaheadSelectItemEvent) {
  //   if (!this.appData.interactionStore) {
  //     this.appData.interactionStore = {};
  //   }
  //   if (!this.appData.interactionStore.configuration) {
  //     this.appData.interactionStore.configuration = {};
  //   }
  //   this.appData.interactionStore.configuration.connector = item.item;
  // }

  get selectedConnector() {
    if (this.appData?.interactionStore?.configuration?.connector) {
      return this.appData.interactionStore.configuration.connector;
    }
  }

  set selectedConnector(val: any) {
    if (!this.appData.interactionStore) {
      this.appData.interactionStore = {};
    }
    if (!this.appData.interactionStore.configuration) {
      this.appData.interactionStore.configuration = {};
    }
    this.appData.interactionStore.configuration.connector = val;
  }

  get retainType() {
    if (this.appData?.interactionStore?.retainPolicy?.retainType) {
      return this.appData.interactionStore.retainPolicy.retainType;
    }
  }

  set retainType(val: any) {
    if (!this.appData.interactionStore) {
      this.appData.interactionStore = {};
    }
    if (!this.appData.interactionStore.retainPolicy) {
      this.appData.interactionStore.retainPolicy = {};
    }
    this.appData.interactionStore.retainPolicy.retainType = val;
  }

  get retainValue() {
    if (this.appData?.interactionStore?.retainPolicy?.retainValue) {
      return this.appData.interactionStore.retainPolicy.retainValue;
    }
  }

  set retainValue(val: any) {
    if (!this.appData.interactionStore) {
      this.appData.interactionStore = {};
    }
    if (!this.appData.interactionStore.retainPolicy) {
      this.appData.interactionStore.retainPolicy = {};
    }
    this.appData.interactionStore.retainPolicy.retainValue = val;
  }

  get version() {
    return environment.version;
  }

  get invalidForm() {
    if (this.appData?.interactionStore?.storeType != 'db'
      && (!this.appData?.interactionStore?.configuration?.connector)) {
      return true;
    }
    return false;
  }
}
