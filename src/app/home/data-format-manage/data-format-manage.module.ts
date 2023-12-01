import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'src/app/utils/directives/click-outside/click-outside.module';
import { BreadcrumbModule } from 'src/app/utils/breadcrumb/breadcrumb.module';
import { SearchBoxModule } from 'src/app/utils/search-box/search-box.module';
import { DataFormatManageComponent } from './data-format-manage.component';
import { SchemaUtilsModule } from '../schema-utils/schema-utils.module';
import { BasicInfoModule } from 'src/app/utils/basic-info/basic-info.module';
import { FormatTypeBadgeModule } from 'src/app/utils/format-type-badge/format-type-badge.module';
import { RouteGuard } from 'src/app/utils/guards/route.guard';
import { StructureFieldModule } from 'src/app/utils/structure-field/structure-field.module';
import { StructureFieldPropertiesModule } from 'src/app/utils/structure-field-properties/structure-field-properties.module';
import { FilterTeamModule } from 'src/app/utils/pipes/filter-team.module';
import { CheckboxModule } from 'src/app/utils/checkbox/checkbox.module';
import { SortablejsModule } from 'ngx-sortablejs';
import { RoundRadioModule } from 'src/app/utils/round-radio/round-radio.module';
import { SwitchModule } from 'src/app/utils/switch/switch.module';
import { PasteJsonModule } from 'src/app/utils/paste-json/paste-json.module';

const routes: Routes = [
  {
    path: '', component: DataFormatManageComponent, canDeactivate: [RouteGuard]
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    ClickOutsideModule,
    BreadcrumbModule,
    SearchBoxModule,
    SchemaUtilsModule,
    BasicInfoModule,
    FormatTypeBadgeModule,
    StructureFieldModule,
    StructureFieldPropertiesModule,
    FilterTeamModule,
    CheckboxModule,
    SortablejsModule,
    RoundRadioModule,
    SwitchModule,
    PasteJsonModule
  ],
  declarations: [DataFormatManageComponent],
  exports: [RouterModule]
})
export class DataFormatManageModule { }
