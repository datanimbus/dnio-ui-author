import { Component, OnInit, ViewChild, TemplateRef, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonService } from '../services/common.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'odp-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit, OnDestroy {

  @ViewChild('changePasswordModal', { static: true }) changePasswordModal: TemplateRef<HTMLElement>;
  @Input() toggleModal: boolean;
  @Output() toggleModalChange: EventEmitter<boolean>;
  changePasswordForm: UntypedFormGroup;
  changePasswordModalRef: NgbModalRef;
  message: string;
  showPassword;
  constructor(private commonService: CommonService,
    private ts: ToastrService,
    private fb: UntypedFormBuilder) {
    const self = this;
    self.toggleModalChange = new EventEmitter();
    self.changePasswordForm = self.fb.group({
      oldpassword: [null, [Validators.required, Validators.minLength(8)]],
      newpassword: [null, [Validators.required, Validators.minLength(8)]],
      confirmpassword: [null, [Validators.required, Validators.minLength(8)]]
    });
    self.showPassword = {};
  }

  ngOnInit() {
    const self = this;
    self.changePasswordModalRef = self.commonService.modal(self.changePasswordModal);
    self.changePasswordModalRef.result.then(close => {
      self.toggleModalChange.emit(false);
    }, dismiss => {
      self.toggleModalChange.emit(false);
    });
  }

  ngOnDestroy() {
    const self = this;
    if (self.changePasswordModalRef) {
      self.changePasswordModalRef.close();
    }
  }

  changePassword() {
    const self = this;
    self.message = null;
    self.changePasswordForm.get('oldpassword').markAsDirty();
    self.changePasswordForm.get('newpassword').markAsDirty();
    self.changePasswordForm.get('confirmpassword').markAsDirty();
    if (self.changePasswordForm.invalid) {
      return;
    }
    self.changePasswordForm.controls['confirmpassword'].disable();
    self.commonService.put('user', `/auth/change-password/`+self.commonService.userDetails.username, self.changePasswordForm.value).subscribe(res => {
      self.changePasswordModalRef.close();
      if (res) {
        self.ts.success('Redirecting to login screen, Please login again');
        setTimeout(() => {
          self.commonService.logout();
        }, 3000);
      }
    }, err => {
      self.message = err.error.message;
    });
  }

  get newPasswordRequired() {
    const self = this;
    return self.changePasswordForm.get('newpassword').dirty && self.changePasswordForm.get('newpassword').hasError('required');
  }
  get cnfrmPasswordRequired() {
    const self = this;
    return self.changePasswordForm.get('confirmpassword').dirty && self.changePasswordForm.get('confirmpassword').hasError('required');
  }
  get oldPasswordRequired() {
    const self = this;
    return self.changePasswordForm.get('oldpassword').dirty && self.changePasswordForm.get('oldpassword').hasError('required');
  }
  get newPasswordLength() {
    const self = this;
    return self.changePasswordForm.get('newpassword').dirty && self.changePasswordForm.get('newpassword').hasError('minlength');
  }
  get matchPwd() {
    const self = this;
    return self.changePasswordForm.get('confirmpassword').dirty &&
      (self.changePasswordForm.get('newpassword').value !== self.changePasswordForm.get('confirmpassword').value);
  }
  get oldPasswordLength() {
    const self = this;
    return self.changePasswordForm.get('oldpassword').dirty && self.changePasswordForm.get('oldpassword').hasError('minlength');
  }
}
