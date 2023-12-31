import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';

import { CommonService } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-group-author-bots',
  templateUrl: './group-author-bots.component.html',
  styleUrls: ['./group-author-bots.component.scss']
})
export class GroupAuthorBotsComponent implements OnInit {

  @Input() roles: Array<any>;
  @Output() rolesChange: EventEmitter<Array<any>>;
  dropdownToggle: {
    [key: string]: boolean;
  };
  edit: any;
  managePermissions: Array<string>;
  viewPermissions: Array<string>;
  constructor(private commonService: CommonService) {
    this.rolesChange = new EventEmitter();
    this.dropdownToggle = {};
    this.edit = { status: true };
    this.managePermissions = ['PMBBC', 'PMBBU', 'PMBBD', 'PMBA', 'PMBG'];
    this.viewPermissions = ['PVBB'];
  }

  ngOnInit() {
  }

  getPermissionObject(id: string, entity: any) {
    return {
      id: id,
      app: this.commonService.app._id,
      entity: entity,
      type: 'author'
    };
  }

  hasPermission(type: string) {
    return this.commonService.hasPermission(type);
  }

  changeAllPermissions(val: string) {
    if (val == 'manage') {
      _.remove(this.roles, (item) => item.id.startsWith('PMB') || item.id.startsWith('PVB'));
      this.managePermissions.forEach(item => {
        this.roles.push(this.getPermissionObject(item, 'USER'));
      });
    } else if (val == 'view') {
      _.remove(this.roles, (item) => item.id.startsWith('PMB') || item.id.startsWith('PVB'));
      this.viewPermissions.forEach(item => {
        this.roles.push(this.getPermissionObject(item, 'USER'));
      });
    } else if (val == 'blocked') {
      _.remove(this.roles, (item) => item.id.startsWith('PMB') || item.id.startsWith('PVB'));
    }
  }

  get globalPermission() {
    const perms = this.roles.map(e => e.id);
    if (_.intersection(this.managePermissions, perms).length === this.managePermissions.length) {
      return 'manage';
    } else if (_.intersection(this.viewPermissions, perms).length === this.viewPermissions.length) {
      return 'view';
    } else if (perms.length == 0) {
      return 'blocked';
    } else {
      return 'custom';
    }
  }

  get basicPermission() {
    const viewIndex = this.roles.findIndex(r => r.id === 'PVBB' && r.entity === 'USER');
    const manageIndex = this.roles.findIndex(r => (r.id === 'PMBBC' || r.id === 'PMBBU' || r.id === 'PMBBD') && r.entity === 'USER');
    if (manageIndex > -1) {
      return 'manage';
    }
    if (viewIndex > -1) {
      return 'view';
    }
    return 'blocked';
  }

  set basicPermission(val: any) {
    const blockedIndex = this.roles.findIndex(r => r.id === 'PNBB' && r.entity === 'USER');
    if (blockedIndex > -1) {
      this.roles.splice(blockedIndex, 1);
    }
    const viewIndex = this.roles.findIndex(r => r.id === 'PVBB' && r.entity === 'USER');
    if (viewIndex > -1) {
      this.roles.splice(viewIndex, 1);
    }
    const createIndex = this.roles.findIndex(r => r.id === 'PMBBC' && r.entity === 'USER');
    if (createIndex > -1) {
      this.roles.splice(createIndex, 1);
    }
    const editIndex = this.roles.findIndex(r => r.id === 'PMBBU' && r.entity === 'USER');
    if (editIndex > -1) {
      this.roles.splice(editIndex, 1);
    }
    const deleteIndex = this.roles.findIndex(r => r.id === 'PMBBD' && r.entity === 'USER');
    if (deleteIndex > -1) {
      this.roles.splice(deleteIndex, 1);
    }
    if (Array.isArray(val)) {
      val.forEach(item => {
        this.roles.push(this.getPermissionObject(item, 'USER'));
      });
    } else {
      if (val === 'PNBB') {
        this.sessionPermission = 'PNBA';
        this.groupPermission = 'PNBG';
      }
      this.roles.push(this.getPermissionObject(val, 'USER'));
    }
  }

  get sessionPermission() {
    const manageIndex = this.roles.findIndex(r => r.id === 'PMBA');
    if (manageIndex > -1) {
      return 'manage';
    }
    return 'blocked';
  }

  set sessionPermission(val: any) {
    const blockedIndex = this.roles.findIndex(r => r.id === 'PNBA' && r.entity === 'USER');
    if (blockedIndex > -1) {
      this.roles.splice(blockedIndex, 1);
    }
    const manageIndex = this.roles.findIndex(r => r.id === 'PMBA' && r.entity === 'USER');
    if (manageIndex > -1) {
      this.roles.splice(manageIndex, 1);
    }
    if (Array.isArray(val)) {
      val.forEach(item => {
        this.roles.push(this.getPermissionObject(item, 'USER'));
      });
    } else {
      if (val === 'PMBA' && this.basicPermission === 'blocked') {
        this.basicPermission = 'PVBB';
      }
      this.roles.push(this.getPermissionObject(val, 'USER'));
    }
  }

  get groupPermission() {
    const manageIndex = this.roles.findIndex(r => r.id === 'PMBG');
    if (manageIndex > -1) {
      return 'manage';
    }
    return 'blocked';
  }

  set groupPermission(val: any) {
    const blockedIndex = this.roles.findIndex(r => r.id === 'PNBG' && r.entity === 'USER');
    if (blockedIndex > -1) {
      this.roles.splice(blockedIndex, 1);
    }
    const manageIndex = this.roles.findIndex(r => r.id === 'PMBG' && r.entity === 'USER');
    if (manageIndex > -1) {
      this.roles.splice(manageIndex, 1);
    }
    if (Array.isArray(val)) {
      val.forEach(item => {
        this.roles.push(this.getPermissionObject(item, 'USER'));
      });
    } else {
      if (val === 'PMBG' && this.basicPermission === 'blocked') {
        this.basicPermission = 'PVBB';
      }
      this.roles.push(this.getPermissionObject(val, 'USER'));
    }
  }
}
