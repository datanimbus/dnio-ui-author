import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService, GetOptions } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-flow-properties',
  templateUrl: './flow-properties.component.html',
  styleUrls: ['./flow-properties.component.scss']
})
export class FlowPropertiesComponent {

  @Input() edit: any;
  @Input() currNode: any;
  @Input() nodeList: Array<any>;
  flowList: Array<any>;
  searchTerm: string;
  showLoader: boolean;
  subscriptions: any;
  constructor(private commonService: CommonService,
    private appService: AppService) {
    this.edit = {
      status: false
    };
    this.flowList = [];
    this.subscriptions = {};
  }
  ngOnInit(): void {
    this.loadInitial();
  }

  loadInitial() {
    this.showLoader = true;
    this.commonService.get('partnerManager', `/${this.commonService.app._id}/flow`, {
      sort: '-_metadata.lastUpdated',
      filter: {
        'inputNode.type': 'API',
      },
      count: 5

    }).subscribe((res) => {
      this.showLoader = false;
      this.flowList = res;
      this.selectDefault();
    }, err => {
      this.showLoader = false;
      this.flowList = [];
    });
  }

  searchFlow(searchTerm: string) {
    const options: GetOptions = {
      sort: '-_metadata.lastUpdated',
      filter: {
        'inputNode.type': 'API',
        name: '/' + searchTerm + '/',
      },
      select: 'name',
      count: 5
    };
    this.searchTerm = searchTerm;
    this.showLoader = true;
    this.commonService.get('partnerManager', `/${this.commonService.app._id}/flow`, options).subscribe((res) => {
      this.showLoader = false;
      this.flowList = res;
      this.selectDefault();
    }, err => {
      this.showLoader = false;
      this.flowList = [];
    });
  }

  clearSearch() {
    this.flowList = [];
    this.searchTerm = null;
    this.loadInitial();
  }

  selectDefault() {
    if (this.currNode.options && this.currNode.options.flow && this.currNode.options.flow._id) {
      this.flowList.forEach(item => {
        if (item._id == this.currNode.options.flow._id) {
          item._selected = true;
        }
      });
    }
  }

  toggleItem(flag: boolean, item: any) {
    this.flowList.forEach(df => {
      df._selected = false;
    });
    item._selected = flag;
  }

  selectFlow() {
    let temp = this.appService.cloneObject(this.flowList.find(e => e._selected));
    this.currNode.options.flow = {
      _id: temp._id
    };
  }

  removeFlow() {
    delete this.currNode.options.flow;
    this.flowList.forEach(e => {
      delete e._selected;
    });
  }

  get isFlowSelected() {
    return this.flowList.some(e => e._selected);
  }

  get selectedFlow() {
    if (this.currNode.options.flow && this.currNode.options.flow._id) {
      return this.flowList.find(e => e._selected);
    }
    return null;
  }
}
