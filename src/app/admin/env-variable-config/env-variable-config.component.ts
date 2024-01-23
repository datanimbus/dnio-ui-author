import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonService } from 'src/app/utils/services/common.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

interface EnvironmentVariable {
  value: any;
  type: string;
  _id: string;
  usedIn: string;
  description: string;
  classification: string;
}

@Component({
  selector: 'odp-env-variable-config',
  templateUrl: './env-variable-config.component.html',
  styleUrls: ['./env-variable-config.component.scss']
})
export class EnvVariableConfigComponent implements OnInit, OnDestroy {
  envVariableList: EnvironmentVariable[] = [];
  filteredEnvVariableList: EnvironmentVariable[] = [];
  selectedTab: string = 'Runtime';
  private subscriptions: Subscription[] = [];

  constructor(
    private commonService: CommonService,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.fetchAllEnvVariables();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  fetchAllEnvVariables(): void {
    const selectFields = 'value,type,_id,usedIn,description,classification';
    const requestParams = { noApp: true, count: 100, select: selectFields };

    this.subscriptions.push(
      this.commonService.get('user', '/admin/environmentVariable', requestParams)
        .subscribe(
          (res: EnvironmentVariable[]) => {
            this.envVariableList = res.sort((a, b) => a._id.toLowerCase().localeCompare(b._id.toLowerCase()));
            this.filterVariables('Runtime');
          },
          (error) => this.handleError(error)
        )
    );
  }

  saveConfig(): void {
    this.commonService.put('user', '/admin/environmentVariable', this.filteredEnvVariableList)
      .subscribe(
        () => {
          this.fetchAllEnvVariables();
          this.toastrService.success('Environment Variable Configuration Updated');
        },
        (error) => this.handleError(error)
      );
  }

  filterVariables(classification: string): void {
    this.selectedTab = classification;

    // Determine user auth modes
    const rbacUserAuthModesVariable = this.envVariableList.find(variable => variable._id === 'RBAC_USER_AUTH_MODES');
    const rbacUserAuthModesValue = rbacUserAuthModesVariable ? rbacUserAuthModesVariable.value : 'local';

    // Check if 'ldap' or 'azure' are enabled
    const isLDAPEnabled = rbacUserAuthModesValue.includes('ldap');
    const isAzureEnabled = rbacUserAuthModesValue.includes('azure');
  
    // Filter variables based on user auth modes
    this.filteredEnvVariableList = this.envVariableList
      .filter(variable => {
        if ((!isLDAPEnabled && variable._id.startsWith('LDAP')) || (!isAzureEnabled && variable._id.startsWith('AZURE'))) {
          return false;
        }
        return true;
      })
      .filter(variable => variable.classification === classification);
  }
  

  inputType(type: string): string {
    return type === 'number' ? 'number' : 'text';
  }

  private handleError(error: any): void {
    this.commonService.errorToast(error);
  }
}