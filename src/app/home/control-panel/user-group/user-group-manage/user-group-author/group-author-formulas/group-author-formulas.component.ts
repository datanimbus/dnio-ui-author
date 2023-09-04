import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-group-author-formulas',
  templateUrl: './group-author-formulas.component.html',
  styleUrls: ['./group-author-formulas.component.scss']
})
export class GroupAuthorFormulasComponent {
  @Input() roles: Array<any>;
  @Output() rolesChange: EventEmitter<Array<any>>;
  edit: any;

  constructor(private commonService: CommonService,
    private appService: AppService) {
    this.roles = [];
    this.rolesChange = new EventEmitter();
    this.edit = { status: true };
  }

  ngOnInit() {
    if (!this.roles) {
      this.roles = [];
    }
  }

  ngOnDestroy(): void {

  }

  getPermissionObject(type: string) {
    return {
      id: type,
      app: this.commonService.app._id,
      entity: 'PLUGIN',
      type: 'author'
    };
  }

  hasPermission(type: string) {
    return this.commonService.hasPermission(type);
  }

  set permissionType(val: any) {
    const blockedIndex = this.roles.findIndex(r => r.id === 'PNPL' && r.entity === 'PLUGIN');
    if (blockedIndex > -1) {
      this.roles.splice(blockedIndex, 1);
    }
    const manageIndex = this.roles.findIndex(r => r.id === 'PMPL' && r.entity === 'PLUGIN');
    if (manageIndex > -1) {
      this.roles.splice(manageIndex, 1);
    }
    const viewIndex = this.roles.findIndex(r => r.id === 'PVPL' && r.entity === 'PLUGIN');
    if (viewIndex > -1) {
      this.roles.splice(viewIndex, 1);
    }
    this.roles.push(this.getPermissionObject(val));
  }

  get permissionType() {
    if (this.roles.find(r => r.id === 'PMPL' && r.entity === 'PLUGIN')) {
      return 'manage';
    } else if (this.roles.find(r => r.id === 'PVPL' && r.entity === 'PLUGIN')) {
      return 'view';
    } else {
      return 'blocked';
    }
  }

}
