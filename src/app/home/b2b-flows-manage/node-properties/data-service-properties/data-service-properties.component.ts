import { Component, Input, OnInit } from '@angular/core';
import { OperatorFunction, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { AppService } from 'src/app/utils/services/app.service';
import { B2bFlowService } from '../../b2b-flow.service';
import * as _ from 'lodash';

@Component({
  selector: 'odp-data-service-properties',
  templateUrl: './data-service-properties.component.html',
  styleUrls: ['./data-service-properties.component.scss']
})
export class DataServicePropertiesComponent implements OnInit {

  @Input() edit: any;
  @Input() currNode: any;
  @Input() nodeList: Array<any>;
  prevNode: any;
  toggle: any;
  searchTerm: any;
  constructor(private appService: AppService, private flowService: B2bFlowService) {
    this.edit = { status: false };
    this.toggle = {};
  }

  ngOnInit(): void {
    this.prevNode = this.nodeList.find(e => (e.onSuccess || []).findIndex(es => es._id == this.currNode._id) > -1);
    this.setDefaultData();
  }

  setDefaultData() {
    if (this.currNode && this.currNode.options) {
      if (this.prevNode && (!this.currNode.options.authorization)) {
        this.currNode.options.authorization = `{{${this.prevNode?._id}.headers.authorization}}`;
      }
      if (this.currNode.options.update && !this.currNode.options.fields) {
        this.currNode.options.fields = '_id';
      }
      // if (this.prevNode && (this.currNode.options.update || this.currNode.options.insert) && (!this.currNode.options.body || !this.currNode?.options?.body?.includes(this.prevNode._id))) {
      //   this.currNode.options.body = `{{${this.prevNode?._id}.responseBody}}`;
      // }
      if (this.currNode.options.get) {
        if (!this.currNode.options.select) {
          this.currNode.options.select = '*';
        }
        if (!this.currNode.options.sort) {
          this.currNode.options.sort = '_metadata.lastUpdated';
        }
        if (!this.currNode.options.count) {
          this.currNode.options.count = 10;
        }
        if (!this.currNode.options.page) {
          this.currNode.options.page = 1;
        }
        if (!this.currNode.options.filter) {
          this.currNode.options.filter = '{}';
        }
      }
      // if (this.prevNode && this.currNode.options.delete) {
      //   this.currNode.options.documentId = `{{${this.prevNode?._id}.responseBody._id}}`;
      // }
    }
  }

  selectDataService(data: any) {
    this.currNode.dataStructure.incoming = this.appService.cloneObject(data);
    this.currNode.dataStructure.outgoing = this.appService.cloneObject(data);
    this.currNode.options.filter = [];
    this.currNode.options.filterString = [];
  }

  setDataServiceOperation(type: string, val: any) {
    delete this.currNode.options.documentId;
    delete this.currNode.options.body;
    delete this.currNode.options.fields;
    delete this.currNode.options.select;
    delete this.currNode.options.sort;
    delete this.currNode.options.count;
    delete this.currNode.options.filter;

    if (type == 'get' || type == 'delete') {
      delete this.currNode.options.insert;
      delete this.currNode.options.update;
      if (type == 'get') {
        delete this.currNode.options.delete;
      } else {
        delete this.currNode.options.get;
      }
    }
    if (type == 'update' || type == 'insert') {
      delete this.currNode.options.get;
      delete this.currNode.options.delete;
    }
    if (!this.currNode.options.get &&
      !this.currNode.options.update &&
      !this.currNode.options.insert &&
      !this.currNode.options.delete) {
      this.currNode.options.insert = true;
    }
    this.setDefaultData();
  }


  formatter(result: any) {
    if (result && typeof result == 'object') {
      return result.label;
    }
    return result;
  };

  search: OperatorFunction<string, readonly { label: string, value: string }[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) => {
        const regex = /{{(?!.*}})(.*)/g;
        const matches = term.match(regex) || [];
        this.searchTerm = matches.length > 0 ? _.cloneDeep(matches).pop() : '';
        // term = term.split(' ').filter((ele) => ele.startsWith("{{") && !ele.endsWith("}")).pop() || '';
        // this.searchTerm = term;
        if (this.searchTerm) {
          term = this.searchTerm.replace('{{', '');
        }
        return matches.length === 0 && this.searchTerm === '' ? [] : this.variableSuggestions.filter((v) => v.label.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 15);
      }),
    );

  onValueChange(value: any, type: any) {
    if (type) {
      this.currNode.options[type] = type === 'count' || type === 'page' ? parseInt(value) : value;
    }
  }

  get variableSuggestions() {
    return this.flowService.getSuggestions(this.currNode)
  }


  get isDataServiceSelected() {
    if (this.currNode.options.dataService && this.currNode.options.dataService._id) {
      return true;
    }
    return false;
  }

  get isSchemaFree(){
    return this.currNode.options?.dataService?.schemaFree || false
  }
}
