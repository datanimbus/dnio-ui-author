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
}

@Component({
  selector: 'odp-env-variable-config',
  templateUrl: './env-variable-config.component.html',
  styleUrls: ['./env-variable-config.component.scss']
})
export class EnvVariableConfigComponent implements OnInit, OnDestroy {
  envVariableList: EnvironmentVariable[] = [];
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

    const subscription = this.commonService.get('user', '/admin/environmentVariable', requestParams)
      .subscribe(
        (res: EnvironmentVariable[]) => {
          this.envVariableList = res.sort((a, b) => a._id.toLowerCase().localeCompare(b._id.toLowerCase()));
        },
        (error) => {
          this.handleError(error);
        }
      );

    this.subscriptions.push(subscription);
  }

  saveConfig(): void {
    this.commonService.put('user', '/admin/environmentVariable', this.envVariableList)
      .subscribe(
        () => {
          this.fetchAllEnvVariables();
          this.toastrService.success('Environment Variable Configuration Updated');
        },
        (error) => {
          this.handleError(error);
        }
      );
  }

  private handleError(error: any): void {
    this.commonService.errorToast(error);
  }
}