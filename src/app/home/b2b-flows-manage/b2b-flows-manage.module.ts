import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { B2bFlowsManageComponent } from './b2b-flows-manage.component';
import { ClickOutsideModule } from 'src/app/utils/directives/click-outside/click-outside.module';
import { BreadcrumbModule } from 'src/app/utils/breadcrumb/breadcrumb.module';
import { SearchBoxModule } from 'src/app/utils/search-box/search-box.module';
import { DeleteModalModule } from 'src/app/utils/delete-modal/delete-modal.module';
import { FormatTypeBadgeModule } from 'src/app/utils/format-type-badge/format-type-badge.module';
import { BasicInfoModule } from 'src/app/utils/basic-info/basic-info.module';
import { CodeEditorModule } from 'src/app/utils/code-editor/code-editor.module';
import { DateFormatModule } from 'src/app/utils/date-format/date-format.module';
import { OnChangeModule } from 'src/app/utils/directives/on-change/on-change.module';
import { FlowNodeComponent } from './flow-node/flow-node.component';
import { AutoFocusModule } from 'src/app/utils/directives/auto-focus/auto-focus.module';
import { B2bFlowService } from './b2b-flow.service';
import { NodePropertiesComponent } from './node-properties/node-properties.component';
import { CheckboxModule } from 'src/app/utils/checkbox/checkbox.module';
import { NodeMappingComponent } from './node-properties/node-mapping/node-mapping.component';
import { DataStructureSelectorModule } from 'src/app/utils/data-structure-selector/data-structure-selector.module';
import { FunctionSelectorComponent } from './node-properties/function-selector/function-selector.component';
import { ServiceSelectorComponent } from './node-properties/service-selector/service-selector.component';
import { AgentSelectorComponent } from './node-properties/agent-selector/agent-selector.component';
import { RoundRadioModule } from 'src/app/utils/round-radio/round-radio.module';
import { DataServicePropertiesComponent } from './node-properties/data-service-properties/data-service-properties.component';
import { ConnectorPropertiesComponent } from './node-properties/connector-properties/connector-properties.component';
import { SftpConnectorComponent } from './node-properties/connector-properties/sftp-connector/sftp-connector.component';
import { MysqlConnectorComponent } from './node-properties/connector-properties/mysql-connector/mysql-connector.component';
import { PostgreConnectorComponent } from './node-properties/connector-properties/postgre-connector/postgre-connector.component';
import { KafkaConnectorComponent } from './node-properties/connector-properties/kafka-connector/kafka-connector.component';
import { MongodbConnectorComponent } from './node-properties/connector-properties/mongodb-connector/mongodb-connector.component';
import { RouteGuard } from '../../utils/guards/route.guard';
import { NodeDataSelectorComponent } from './node-properties/node-data-selector/node-data-selector.component';
import { AddHeadersComponent } from './node-properties/add-headers/add-headers.component';
import { MssqlConnectorComponent } from './node-properties/connector-properties/mssql-connector/mssql-connector.component';
import { FormulaEditorComponent } from './node-properties/node-mapping/formula-editor/formula-editor.component';
import { InputDataSelectorComponent } from './node-properties/input-data-selector/input-data-selector.component';
import { OnHoverModule } from 'src/app/utils/on-hover/on-hover.module';
import { PathPropertiesComponent } from './path-properties/path-properties.component';
import { ColorPickerModule } from 'src/app/utils/color-picker/color-picker.module';
import { PayloadCreatorModule } from 'src/app/utils/payload-creator/payload-creator.module';
import { PathConditionCreatorComponent } from './path-properties/path-condition-creator/path-condition-creator.component';
import { SwitchModule } from 'src/app/utils/switch/switch.module';
import { ErrorNodeComponent } from './error-node/error-node.component';
import { CommonFilterModule } from 'src/app/utils/pipes/common-filter/common-filter.module';
import { MappingService } from './node-properties/node-mapping/mapping.service';
import { StyledTextModule } from '../../utils/styled-text/styled-text.module';
import { FieldTypeModule } from 'src/app/utils/field-type/field-type.module';
import { ChangeOnEditModule } from 'src/app/utils/change-on-edit/change-on-edit.module';
import { AutocompleteOnEditModule } from '../../utils/autocomplete-on-edit/autocomplete-on-edit.module';
import { ChangeOnEditComponent } from '../../utils/change-on-edit/change-on-edit.component';
import { PluginSelectorComponent } from './node-properties/marketplace-selector/marketplace-selector.component';
import { EditorModule } from 'src/app/utils/editor/editor.module';
import { B2bPathService } from './b2b-path.service';
import { ConverterPropertiesComponent } from './node-properties/converter-properties/converter-properties.component';
import { FormatSelectorComponent } from './node-properties/converter-properties/format-selector/format-selector.component';
import { SourceSelectorComponent } from './node-properties/converter-properties/source-selector/source-selector.component';
import { FlowContantsComponent } from './flow-contants/flow-contants.component';
import { FlowVolumeMountsComponent } from './flow-volume-mounts/flow-volume-mounts.component';
import { SideCanvasModule } from 'src/app/utils/side-canvas/side-canvas.module';
import { MappingPresetComponent } from './node-properties/node-mapping/mapping-preset/mapping-preset.component';
import { FileRwPropertiesComponent } from './node-properties/file-rw-properties/file-rw-properties.component';
import { ViewBoxModule } from 'src/app/utils/view-box/view-box.module';
import { NodeAdvancedFilterComponent } from './node-properties/node-advanced-filter/node-advanced-filter.component';
import { DatePickerModule } from 'src/app/utils/date-picker/datePicker.module';
import { FlowPropertiesComponent } from './node-properties/flow-properties/flow-properties.component';
import { ConditionPropertiesComponent } from './node-properties/condition-properties/condition-properties.component';
import { SearchTermModule } from 'src/app/utils/search-term/search-term.module';

const routes: Routes = [
  {
    path: '', component: B2bFlowsManageComponent, canDeactivate: [RouteGuard]
  }
];

@NgModule({
  declarations: [
    B2bFlowsManageComponent,
    FlowNodeComponent,
    NodePropertiesComponent,
    NodeMappingComponent,
    FunctionSelectorComponent,
    ServiceSelectorComponent,
    AgentSelectorComponent,
    DataServicePropertiesComponent,
    ConnectorPropertiesComponent,
    SftpConnectorComponent,
    MysqlConnectorComponent,
    PostgreConnectorComponent,
    KafkaConnectorComponent,
    MongodbConnectorComponent,
    NodeDataSelectorComponent,
    AddHeadersComponent,
    MssqlConnectorComponent,
    FormulaEditorComponent,
    InputDataSelectorComponent,
    PathPropertiesComponent,
    PathConditionCreatorComponent,
    ErrorNodeComponent,
    PluginSelectorComponent,
    ConverterPropertiesComponent,
    FormatSelectorComponent,
    SourceSelectorComponent,
    FlowContantsComponent,
    FlowVolumeMountsComponent,
    MappingPresetComponent,
    FileRwPropertiesComponent,
    NodeAdvancedFilterComponent,
    FlowPropertiesComponent,
    ConditionPropertiesComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    ClickOutsideModule,
    BreadcrumbModule,
    SearchBoxModule,
    DeleteModalModule,
    FormatTypeBadgeModule,
    BasicInfoModule,
    BreadcrumbModule,
    CodeEditorModule,
    DateFormatModule,
    OnChangeModule,
    AutoFocusModule,
    CheckboxModule,
    DataStructureSelectorModule,
    RoundRadioModule,
    OnHoverModule,
    ColorPickerModule,
    PayloadCreatorModule,
    SwitchModule,
    CommonFilterModule,
    StyledTextModule,
    FieldTypeModule,
    ChangeOnEditModule,
    AutocompleteOnEditModule,
    EditorModule,
    SideCanvasModule,
    ViewBoxModule,
    DatePickerModule,
    SearchTermModule
  ],
  exports: [B2bFlowsManageComponent],
  providers: [B2bFlowService, MappingService, ChangeOnEditComponent, B2bPathService]
})
export class B2bFlowsManageModule { }
