import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { APIConfig } from 'src/app/utils/interfaces/apiConfig';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-connector-selector',
  templateUrl: './connector-selector.component.html',
  styleUrls: ['./connector-selector.component.scss']
})
export class ConnectorSelectorComponent implements OnInit, OnDestroy, OnChanges {

  @Input() type: string;
  @Input() category: string;
  @Input() connector: any;
  @Output() connectorChange: EventEmitter<any>;
  apiOptions: APIConfig;
  connectorList: Array<any>;
  constructor(private appService: AppService,
    private commonService: CommonService,
    private ts: ToastrService) {
    this.connectorChange = new EventEmitter();
    this.connectorList = [];
    this.apiOptions = {
      select: '_id name',
      count: 10,
      filter: {},
      noApp: true
    };
  }

  ngOnInit(): void {
    this.fetchConnectors();
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    this.fetchConnectors();
  }

  fetchConnectors() {
    if (this.type) {
      this.apiOptions.filter.type = this.type;
    }
    if (this.category) {
      this.apiOptions.filter.category = this.category;
    }
    this.commonService.get('user', `/${this.commonService.app._id}/connector`, this.apiOptions).subscribe((res) => {
      this.connectorList = res;
    }, (err) => {
      this.commonService.errorToast(err);
    });
  }

  search(searchTerm: string) {
    this.apiOptions.filter.name = '/' + searchTerm + '/';
    this.fetchConnectors();
  }

  reset() {
    delete this.apiOptions.filter.name;
    this.fetchConnectors();
  }

  onSelectItem(item: any) {
    // this.connectorList.forEach((e) => {
    //   e._selected = false;
    // });
    this.connector = item;
    this.connectorChange.emit(item);
  }

  removeConnector(){
    this.connector = null;
    this.connectorChange.emit(null);
  }
}
