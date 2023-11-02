import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppManageComponent } from './app-manage.component';
import { RouterModule, Routes } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ColorPickerModule } from 'src/app/utils/color-picker/color-picker.module';
import { ClickOutsideModule } from 'src/app/utils/directives/click-outside/click-outside.module';
import { AppCenterPreviewModule } from 'src/app/utils/app-center-preview/app-center-preview.module';
import { SearchBoxModule } from 'src/app/utils/search-box/search-box.module';
import { FilterUserModule } from 'src/app/utils/pipes/filter-user.module';
import { BasicInfoModule } from 'src/app/utils/basic-info/basic-info.module';
import { DeleteModalModule } from 'src/app/utils/delete-modal/delete-modal.module';
import { AppPanelGuard } from 'src/app/utils/guards/app-panel.guard';
import { CheckboxModule } from 'src/app/utils/checkbox/checkbox.module';
import { UploadImageModule } from 'src/app/utils/upload-image/upload-image.module';
import { TimezonePickerModule } from 'src/app/utils/timezone-picker/timezone-picker.module';
import { AppSecretsComponent } from './app-secrets/app-secrets.component';
import { AutoFocusModule } from 'src/app/utils/directives/auto-focus/auto-focus.module';
import { NpmLibrariesComponent } from './npm-libraries/npm-libraries.component';
import { InteractionSettingsComponent } from './interaction-settings/interaction-settings.component';
import { ConnectorSelectorComponent } from './interaction-settings/connector-selector/connector-selector.component';
import { RoundRadioModule } from 'src/app/utils/round-radio/round-radio.module';
const routes: Routes = [
  { path: '', component: AppManageComponent, canActivate: [AppPanelGuard] },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgbModule,
    FormsModule,
    ColorPickerModule,
    ReactiveFormsModule,
    ClickOutsideModule,
    AppCenterPreviewModule,
    SearchBoxModule,
    FilterUserModule,
    BasicInfoModule,
    DeleteModalModule,
    CheckboxModule,
    UploadImageModule,
    TimezonePickerModule,
    AutoFocusModule,
    RoundRadioModule
  ],
  exports: [
    RouterModule
  ],
  declarations: [AppManageComponent, AppSecretsComponent, NpmLibrariesComponent, InteractionSettingsComponent, ConnectorSelectorComponent]
})
export class AppManageModule { }
