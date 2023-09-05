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
  selector: 'odp-formula-listing',
  templateUrl: './formula-listing.component.html',
  styleUrls: ['./formula-listing.component.scss'],
  providers: [CommonFilterPipe]
})
export class FormulaListingComponent {

  formulaList: Array<any> = [];
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
  showNewFormulaWindow: boolean;
  showOptionsDropdown: any;
  selectedItemEvent: any
  selectedFormula: any;
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
      label: 'Formulas'
    }];
    this.definition = [];

    this.commonService.changeBreadcrumb(this.breadcrumbPaths)
    this.openDeleteModal = new EventEmitter();
    this.form = this.fb.group({
      name: [null, [Validators.required, Validators.maxLength(40), Validators.pattern(/^[a-zA-Z]/)]],
      description: [null, [Validators.maxLength(240), Validators.pattern(/^[a-zA-Z]/)]],
      returnType: ['String', [Validators.required]],
      forDataType: ['String', [Validators.required]],
    });
    this.showOptionsDropdown = {};
    this.showLazyLoader = true;
    this.sortModel = {};
    this.formulaList = this.appService.getFormatTypeList();
  }

  ngOnInit() {
    this.showLazyLoader = true;
    this.commonService.apiCalls.componentLoading = false;
    this.getFormulas();
    this.subscriptions['changeApp'] = this.commonService.appChange.subscribe(_app => {
      this.commonService.apiCalls.componentLoading = false;
      this.showLazyLoader = true;
      this.getFormulas();
    });

  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach(e => {
      this.subscriptions[e].unsubscribe();
    });
  }

  newFormula() {
    this.form.reset({ returnType: 'String', forDataType: 'String' });
    this.showNewFormulaWindow = true;
  }

  triggerFormulaCreate() {
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
    this.commonService.post('user', `/${this.commonService.app._id}/formula`, payload).subscribe(res => {
      this.ts.success('Formula Created.');
      this.appService.edit = res._id;
      this.showLazyLoader = false;
      this.router.navigate(['/app/', this.commonService.app._id, 'formula', res._id]);
    }, err => {
      this.showLazyLoader = false;
      this.commonService.errorToast(err);
    });
  }

  editFormula(_index) {
    this.appService.edit = this.formulaList[_index]._id;
    this.router.navigate(['/app/', this.app, 'formula', this.appService.edit]);
  }

  cloneFormula(_index) {
    this.appService.cloneLibraryId = this.records[_index]._id;
    this.cloneData = this.records[_index];
    this.isClone = true;
    this.form.patchValue({
      name: this.cloneData.name + ' Copy',
      formulaType: this.cloneData.formulaType,
      excelType: this.cloneData.excelType
    });
    this.showNewFormulaWindow = true;
  }

  triggerFormulaClone() {
    this.isClone = false;
    const payload = {
      name: this.form.value.name,
      formulaType: this.form.value.formulaType,
      excelType: this.form.value.excelType,
      app: this.cloneData.app,
      attributeCount: this.cloneData.attributeCount,
      character: this.cloneData.character,
      definition: this.cloneData.definition,
      lineSeparator: this.cloneData.lineSeparator,
      strictValidation: this.cloneData.strictValidation
    };
    this.showLazyLoader = true;
    this.commonService.post('user', `/${this.commonService.app._id}/formula`, payload).subscribe(res => {
      this.ts.success('Formula Cloned.');
      this.appService.edit = res._id;
      this.router.navigate(['/app/', this.commonService.app._id, 'formula', res._id]);
      this.showLazyLoader = false;
    }, err => {
      this.showLazyLoader = false;
      this.commonService.errorToast(err);
    });
  }

  getFormulas() {
    if (this.subscriptions['getFormulas']) {
      this.subscriptions['getFormulas'].unsubscribe();
    }
    this.showLazyLoader = true;
    this.formulaList = [];
    this.subscriptions['getFormulas'] = this.commonService.get('user', `/${this.commonService.app._id}/formula?countOnly=true`)
      .pipe(switchMap((ev: any) => {
        return this.commonService.get('user', `/${this.commonService.app._id}/formula`, {
          count: ev,
          select: 'name returnType forDataType'
        });
      }))
      .subscribe(res => {
        this.showLazyLoader = false;
        if (res.length > 0) {
          res.forEach(item => {
            this.formulaList.push(item);
          });
        }
      }, err => {
        this.commonService.errorToast(err, 'We are unable to fetch records, please try again later');
      });
  }

  deleteFormula(_index) {
    this.alertModal.statusChange = false;
    this.alertModal.title = 'Delete formula';
    this.alertModal.message = 'Are you sure you want to delete <span class="text-delete font-weight-bold">'
      + this.formulaList[_index].name + '</span> Formula?';
    this.alertModal.index = _index;
    this.openDeleteModal.emit(this.alertModal);
  }

  closeDeleteModal(data) {
    if (data) {
      const url = `/${this.commonService.app._id}/formula/` + this.formulaList[data.index]._id;
      this.showLazyLoader = true;
      this.subscriptions['deleteFormula'] = this.commonService.delete('user', url).subscribe(_d => {
        this.showLazyLoader = false;
        this.ts.info(_d.message ? _d.message : 'Formula deleted');
        this.getFormulas();
      }, err => {
        this.showLazyLoader = false;
        this.commonService.errorToast(err, 'Unable to delete, please try again later');
      });
    }
  }

  hasPermissionForFormula(id: string) {
    if (this.commonService.isAppAdmin || this.commonService.userDetails.isSuperAdmin) {
      return true;
    } else {
      const list = this.commonService.getEntityPermissions('FORMULA_' + id);
      if (list.length > 0 && list.find(e => e.id === 'PNFO')) {
        return false;
      } else if (list.length === 0 && !this.hasManagePermission('FORMULA') && !this.hasViewPermission('FORMULA')) {
        return false;
      } else {
        return true;
      }
    }
  }

  canEditFormula(id: string) {
    if (this.commonService.isAppAdmin || this.commonService.userDetails.isSuperAdmin) {
      return true;
    } else {
      const list = this.commonService.getEntityPermissions('FORMULA_' + id);
      if (list.length > 0 && list.find(e => e.id === 'PMFO')) {
        return true;
      } else if (list.length === 0 && this.hasManagePermission('FORMULA')) {
        return true;
      } else {
        return false;
      }
    }
  }

  hasManagePermission(entity: string) {
    return this.commonService.hasPermission('PMFO', entity);
  }
  hasViewPermission(entity: string) {
    return this.commonService.hasPermission('PVFO', entity);
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
    this.selectedFormula = this.formulaList[i];
    this.showOptionsDropdown[i] = true;
  }

  selectFormula(formula: any) {
    this.formulaList.forEach(e => {
      e.selected = false;
    });
    formula.selected = true;
    this.form.get('formulaType').patchValue(formula.formulaType);
    if (formula.formulaType === 'EXCEL') {
      this.form.get('excelType').patchValue(formula.excelType);
    }
  }

  isFormulaSelected(formula: any) {
    const formulaType = this.form.get('formulaType').value;
    const excelType = this.form.get('excelType').value;
    let flag = false;
    if (formula.formulaType == formulaType) {
      if (formula.formulaType === 'EXCEL') {
        if (formula.excelType == excelType) {
          flag = true;
        }
      } else {
        flag = true;
      }
    }
    return flag;
  }

  navigate(formula: any) {
    this.router.navigate(['/app/', this.app, 'formula', formula._id])
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
    let records = this.commonPipe.transform(this.formulaList, 'name', this.searchTerm);
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
