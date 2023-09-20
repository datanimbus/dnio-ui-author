import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-formula-manage',
  templateUrl: './formula-manage.component.html',
  styleUrls: ['./formula-manage.component.scss']
})
export class FormulaManageComponent {

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
  selectedFormula: any;
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
        this.getFormula(params.id);
      }
    });
    this.commonService.apiCalls.componentLoading = false;
  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach(e => {
      this.subscriptions[e].unsubscribe();
    });
  }

  getFormula(formulaId: string) {
    this.showLazyLoader = true;
    if (this.subscriptions['getFormula']) {
      this.subscriptions['getFormula'].unsubscribe();
    }
    this.subscriptions['getFormula'] = this.commonService.get('user', `/${this.commonService.app._id}/formula/${formulaId}`).subscribe((res: any) => {
      this.showLazyLoader = false;
      this.selectedFormula = res;
      this.params = this.selectedFormula.params;
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
    this.getFormula(this.selectedFormula._id);
    this.appService.updateCodeEditorState.emit();
  }

  cancel() {
    if (!this.edit.status || this.edit.editClicked || !this.edit.id) {
      this.router.navigate(['/app', this.commonService.app._id, 'formula']);
    } else {
      if (!this.edit.editClicked) {
        this.edit.status = false;
        this.getFormula(this.edit.id);
      }
    }
  }

  saveFormula() {
    this.selectedFormula.params = this.params;
    const url = `/${this.commonService.app._id}/formula/` + this.selectedFormula._id;
    this.showLazyLoader = true;
    this.commonService
      .put('user', url, this.selectedFormula)
      .subscribe(
        (d) => {
          this.showLazyLoader = false;
          this.ts.success('Formula Saved Successfully');
          if (!this.edit.editClicked) {
            this.edit.status = false;
          } else {
            this.router.navigate(['/app', this.commonService.app._id, 'formula']);
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
    this.params.push({ type: 'String' });
  }

  removeParam(index: number) {
    this.params.splice(index, 1);
  }

  convertToKey(value: string, item: any) {
    item.name = this.appService.toCamelCase(value);
  }

  get app() {
    return this.commonService.app._id;
  }

  get isInvalid() {
    if (!this.selectedFormula) {
      return true;
    }
    if (!this.selectedFormula.name || !this.selectedFormula.name.trim()) {
      return true;
    }
    if (!this.selectedFormula.returnType || !this.selectedFormula.returnType.trim()) {
      return true;
    }
    if (this.selectedFormula.params && this.selectedFormula.params.length > 0) {
      let flag = false;
      this.selectedFormula.params.forEach((item) => {
        if (!item.name || !item.type) {
          flag = true;
        }
      });
      if (flag) {
        return true;
      }
    }
    return false;
  }
}
