import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LibraryComponent } from './library.component';
import { SearchBoxModule } from 'src/app/utils/search-box/search-box.module';
import { BreadcrumbModule } from 'src/app/utils/breadcrumb/breadcrumb.module';
import { DeleteModalModule } from 'src/app/utils/delete-modal/delete-modal.module';
import { AutoFocusModule } from 'src/app/utils/directives/auto-focus/auto-focus.module';
import { CommonFilterModule } from 'src/app/utils/pipes/common-filter/common-filter.module';

const routes = [
  { path: '', component: LibraryComponent },
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbModule,
    RouterModule.forChild(routes),
    BreadcrumbModule,
    SearchBoxModule,
    DeleteModalModule,
    AutoFocusModule,
    CommonFilterModule
  ],
  declarations: [
    LibraryComponent
  ]
})
export class LibraryModule { }
