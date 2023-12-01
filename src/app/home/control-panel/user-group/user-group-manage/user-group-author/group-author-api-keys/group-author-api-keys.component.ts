import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonService } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-group-author-api-keys',
  templateUrl: './group-author-api-keys.component.html',
  styleUrls: ['./group-author-api-keys.component.scss']
})
export class GroupAuthorApiKeysComponent {

  @Input() roles: Array<any>;
  @Output() rolesChange: EventEmitter<Array<any>>;
  edit: any;

  constructor(
    private commonService: CommonService,
  ) {
    this.roles = [];
    this.rolesChange = new EventEmitter();
    this.edit = { status: true };
  }

  ngOnInit() {
    if (!this.roles) {
      this.roles = [];
    }
  }

  hasPermission(type: string) {
    return this.commonService.hasPermission(type);
  }

  getPermissionObject(type: string,) {
    return {
      id: type,
      app: this.commonService.app._id,
      entity: 'AK',
      type: 'author'
    };
  }

  set permissionType(val: any) {
    const blockedIndex = this.roles.findIndex(r => r.id === 'PNAK' && r.entity === 'AK');
    if (blockedIndex > -1) {
      this.roles.splice(blockedIndex, 1);
    }
    const manageIndex = this.roles.findIndex(r => r.id === 'PMAK' && r.entity === 'AK');
    if (manageIndex > -1) {
      this.roles.splice(manageIndex, 1);
    }
    const viewIndex = this.roles.findIndex(r => r.id === 'PVAK' && r.entity === 'AK');
    if (viewIndex > -1) {
      this.roles.splice(viewIndex, 1);
    }
    this.roles.push(this.getPermissionObject(val));
  }

  get permissionType() {
    if (this.roles.find(r => r.id === 'PMAK' && r.entity === 'AK')) {
      return 'manage';
    } else if (this.roles.find(r => r.id === 'PVAK' && r.entity === 'AK')) {
      return 'view';
    } else {
      return 'blocked';
    }
  }

}
