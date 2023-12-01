import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

@Component({
  selector: 'odp-app-secrets',
  templateUrl: './app-secrets.component.html',
  styleUrls: ['./app-secrets.component.scss']
})
export class AppSecretsComponent implements OnInit, OnDestroy {

  showNewVarWindow: boolean;
  varList: Array<any>;
  formData: any;
  selectedIndex: number;
  openDeleteModal: EventEmitter<any>;
  constructor(private appService: AppService,
    private commonService: CommonService,
    private ts: ToastrService) {
    this.showNewVarWindow = false;
    this.varList = [];
    this.formData = {};
    this.selectedIndex = -1;
    this.openDeleteModal = new EventEmitter();
  }

  ngOnInit(): void {
    this.fetchVariables();
  }

  ngOnDestroy(): void {

  }

  newVariable() {
    this.formData = {};
    this.showNewVarWindow = true;
  }

  editVariable(index: number) {
    this.selectedIndex = index;
    this.formData = this.appService.cloneObject(this.varList[index]);
    this.showNewVarWindow = true;
  }

  fetchVariables() {
    this.commonService.get('user', `/${this.commonService.app._id}/secrets`, { noApp: true }).subscribe(res => {
      res.forEach(item => {
        item.value = atob(item.value);
      });
      this.varList = res;
    }, err => {
      this.commonService.errorToast(err, 'Unable to Fetch Variables');
    });
  }

  saveVariable() {
    // Check if the variable with the same name already exists in the varList.
    const isVariablePresent = this.varList.some(variable => variable['key'] === this.formData['key']);

    if(!isVariablePresent){
      // Variable is not present, either update or add it.
      if (this.selectedIndex > -1) {
        this.varList.splice(this.selectedIndex, 1, this.formData);
        this.selectedIndex = -1;
      } else {
        this.varList.push(this.formData);
      }

      this.commonService.put('user', `/${this.commonService.app._id}/secrets`, this.varList).subscribe(
        res => {
          res.forEach(item => {
            item.value = atob(item.value);
          });
          this.varList = res;
          this.showNewVarWindow = false;
          this.ts.success('App Variable Created');
        }, 
        err => {
          this.commonService.errorToast(err, 'Unable to Save Variable');
        }
      );
    } else {
      this.commonService.errorToast({},'Variable with same name already exists. Please use a different name');
    }
  }

  deleteVariable(index: number) {
    this.openDeleteModal.emit({
      title: 'Delete Variable?',
      message: `Are you sure you want to delete variable <strong>${this.varList[index].key}</strong>`,
      index
    });
  }

  closeDeleteModal(data) {
    if (data) {
      this.varList.splice(data.index, 1);
      this.commonService.put('user', `/${this.commonService.app._id}/secrets`, this.varList).subscribe(res => {
        res.forEach(item => {
          item.value = atob(item.value);
        });
        this.varList = res;
        this.ts.info('App Variable Deleted');
      }, err => {
        this.commonService.errorToast(err, 'Unable to Save Variable');
      });
    }
  }

  onKeyBlur() {
    if (this.formData.key) {
      this.formData.key = _.toLower(_.snakeCase(this.formData.key));
    }
  }

  get isInvalid() {
    if (!this.formData.key || !this.formData.key.trim()) {
      return true;
    }
    if (!this.formData.value || !this.formData.value.trim()) {
      return true;
    }
    return false;
  }
}
