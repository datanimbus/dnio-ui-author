import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { CommonService } from 'src/app/utils/services/common.service';

@Component({
  selector: 'odp-node-advanced-filter',
  templateUrl: './node-advanced-filter.component.html',
  styleUrls: ['./node-advanced-filter.component.scss']
})
export class NodeAdvancedFilterComponent implements OnInit {
  @Input() toggle: boolean;
  @Output() toggleChange: EventEmitter<boolean> = new EventEmitter();
  @Input() currNode: any;
  @Input() number: boolean;
  @Input() textarea: boolean;
  @Input() value: any;
  @Output() valueChange: EventEmitter<any> = new EventEmitter();
  @Input() edit: any;
  definition: any = [];
  filterOptions: any = {}
  filterArray: Array<any> = [];
  showFromDatePicker: any = [];
  showToDatePicker: any = [];
  dateFrom: Date = new Date();
  dateTo: Date = new Date();
  initialValue: any = [];
  advancedToggle: boolean = false
  @ViewChild('alertModal', { static: false }) alertModal: TemplateRef<HTMLElement>;
  alertModalRef: NgbModalRef;
  alertModalData: any = {};
  hold: boolean = false;

  constructor(private commonService: CommonService) {
    this.alertModalData = {
      title: 'Are you sure you want to toggle filter?',
      message: 'This action will result in losing all the changes you have made on the filter.',
    }
  }

  ngOnInit(): void {
    this.definition = this.createDefinition(this.currNode?.options?.dataService?.definition || []);
    this.definition = this.definition.concat(this.addAdditionalDef())
    console.log(this.definition);

    this.definition.forEach(ele => {
      ele['filterOptions'] = this.setFilterTypeOptions(ele)
    });
    this.filterArray = this.convertToFilters(_.cloneDeep(this.currNode?.options?.filter?.$and || []))
    this.initialValue = _.cloneDeep(this.filterArray)
    if (this.filterArray.length === 0 && (Array.isArray(this.currNode?.options?.filter) ? this.currNode?.options?.filter.length > 0 : this.currNode.options.filter)) {
      this.advancedToggle = true
    }
  }

  addAdditionalDef() {
    return [{
      key: 'lastUpdated',
      type: 'Date',
      properties: {
        name: 'Last Updated At',
        dataPath: 'lastUpdated',
        dataPathSegs: ['lastUpdated']
      }
    }, {
      key: 'createdAt',
      type: 'Date',
      properties: {
        name: 'Created At',
        dataPath: 'createdAt',
        dataPathSegs: ['createdAt']
      }
    }]
  }

  createDefinition(definition) {
    const currentDefinition = _.cloneDeep(definition || []);
    const text = [].concat(...currentDefinition.map(ele => {
      if (ele.definition) {
        const moreDef = this.createDefinition(ele.definition);
        return moreDef;
      }
      return ele;
    }));
    return text
  }

  cancel() {
    this.filterArray = this.initialValue;
    this.showFromDatePicker = [];
    this.showToDatePicker = [];
    this.toggle = false;
    this.advancedToggle = false
    this.toggleChange.emit(this.toggle);
  }

  addCondition() {
    const filterObj = {
      path: this.definition[0].properties.dataPath,
      operator: this.getFilterOptionsItem(this.definition[0])[0].value,
      value: {}
    }
    this.showFromDatePicker[this.filterArray.length] = false;
    this.showToDatePicker[this.filterArray.length] = false;
    this.filterArray.push(filterObj);
  }

  removeCondition(i) {
    this.filterArray.splice(i, 1);
    this.showFromDatePicker.splice(i, 1);
    this.showToDatePicker.splice(i, 1);
  }

  setFilterTypeOptions(item: any) {
    if (item.type === 'Date') {
      return [
        { name: 'Equals', value: 'equals' },
        { name: 'Greater than', value: 'greaterThan' },
        { name: 'Less than', value: 'lessThan' },
        { name: 'In range', value: 'inRange' }
      ];
    } else if (item.type === 'Number') {
      return [
        { name: 'Equals', value: 'equals' },
        { name: 'Greater than', value: 'greaterThan' },
        { name: 'Less than', value: 'lessThan' },
        { name: 'Not equal', value: 'notEquals' },
        { name: 'In range', value: 'inRange' }
      ];
    } else if (item.type === 'Boolean') {
      return [
        // { name: 'Select', value: '' },
        { name: 'Yes', value: 'Yes' },
        { name: 'No', value: 'No' }
      ];
    } else {
      return [
        { name: 'Equals', value: 'equals' },
        { name: 'Not equal', value: 'notEquals' },
        { name: 'Contains', value: 'contains' },
        { name: 'Does not contain', value: 'notContains' }
      ];
    }
  }

  done() {
    if (this.advancedToggle) {

      this.value = this.currNode.options.filter
      this.valueChange.emit(this.value);

      this.toggle = false;
      this.toggleChange.emit(this.toggle);
    }
    else {
      let prefix = ['DATASERVICE_APPROVE', 'DATASERVCE_REJECT'].includes(this.currNode.type) ? 'data.new.' : '';
      this.currNode.options.filterString = this.showFilterString();
      const filterPayload = this.filterArray.map(filter => {
        if (['lastUpdated', 'createdAt'].includes(filter['path'])) {
          prefix = '_metadata.'
        }
        if (filter['operator'].toLowerCase().includes('equal')) {
          const operator = filter['operator'] === 'equals' ? '$eq' : '$ne';
          const path = filter['path'];
          const query = {};
          query[operator] = filter['value']['val'] || filter['value']['from'];
          let final = {};
          final[prefix + path.toString()] = query;
          return final;
        }

        if (filter['operator'].toLowerCase().includes('contain')) {
          const regex = { $regex: filter['value']['val'], $options: 'i' }
          const operation = filter['operator'] === 'contains' ? regex : { $not: regex };
          const path = filter['path'];
          let final = {};
          final[prefix + path.toString()] = operation;
          return final;
        }

        if (filter['operator'].includes('Than')) {
          const operator = filter['operator'] === 'greaterThan' ? '$gt' : '$lt';
          const path = filter['path'];
          const query = {};
          query[operator] = filter['value']['val'] || filter['value']['from'];
          let final = {};
          final[prefix + path.toString()] = query;
          return final;
        }

        if (filter['operator'] === 'inRange') {
          const path = filter['path'];
          const from = filter['value']['from'];
          const to = filter['value']['to'];
          const query = { $gte: from, $lte: to };
          let final = {};
          final[prefix + path.toString()] = query;
          return final;
        }

        if (filter['operator'] === 'Yes' || filter['operator'] === 'No') {
          const path = filter['path'];
          const query = filter['operator'] === 'Yes' ? true : false;
          let final = {};
          final[path.toString()] = query;
          return final;
        }
      })
      this.value = filterPayload ? { $and: filterPayload } : {};
      this.valueChange.emit(this.value); this.toggle = false;
      this.toggleChange.emit(this.toggle);
    }

    this.advancedToggle = false

  }


  convertToFilters(queryArray) {
    let prefix = ['DATASERVICE_APPROVE', 'DATASERVCE_REJECT'].includes(this.currNode.type) ? 'data.new.' : ''
    const filters = [];

    queryArray.forEach(queryObject => {
      let path = Object.keys(queryObject)[0];
      if (path.startsWith('_metadata')) {
        prefix = '_metadata.'
      }
      const value = queryObject[path];
      path = path.replace(prefix, '');

      if (value.hasOwnProperty('$eq') || value.hasOwnProperty('$ne')) {
        const type = this.definition.find(ele => ele.properties.dataPath === path).type;
        const operator = value.hasOwnProperty('$eq') ? 'equals' : 'notEquals';
        const query = {
          path: path,
          operator: operator,
          value: type === 'Date' ? { from: value['$eq'] || value['$ne'] } : { val: value['$eq'] || value['$ne'] }
        };
        filters.push(query);
      } else if (value.hasOwnProperty('$regex') || value.hasOwnProperty('$not')) {
        const operator = value.hasOwnProperty('$regex') ? 'contains' : 'notContains';
        const query = {
          path: path,
          operator: operator,
          value: { val: value['$regex'] }
        };
        filters.push(query);
      } else if (value.hasOwnProperty('$gt') || value.hasOwnProperty('$lt')) {
        const operator = value.hasOwnProperty('$gt') ? 'greaterThan' : 'lessThan';
        const queryVal = value['$gt'] || value['$lt'];
        const finalQueryVal = typeof queryVal === 'number' ? { val: queryVal } : { from: queryVal, to: queryVal };
        const query = {
          path: path,
          operator: operator,
          value: finalQueryVal
        };
        filters.push(query);
      } else if (value.hasOwnProperty('$gte') && value.hasOwnProperty('$lte')) {
        const query = {
          path: path,
          operator: 'inRange',
          value: { from: value['$gte'], to: value['$lte'] }
        };
        filters.push(query);
      } else if (typeof value === 'boolean') {
        // const operator = value ? 'Yes' : 'No';
        const query = {
          path: path,
          operator: value ? 'Yes' : 'No',
          value: { val: value ? 'Yes' : 'No' }
        };
        filters.push(query);
      }
    });
    console.log(filters);
    return filters;
  }


  showFilterString() {
    const opObj = {
      'equals': '=',
      'notEquals': '!=',
      'greaterThan': '>',
      'lesserThan': '<',
      'contains': 'contains',
      'notContains': 'does not contain',

    }
    return this.filterArray.length === 0 ? ['{}'] : this.filterArray.map(filter => {
      if (filter.operator === 'inRange') {
        return `${filter.value.from}' <= ${filter.path} <= '${filter.value.to}'`;
      } else {
        return `${filter.path} ${filter.operator === 'Yes' || filter.operator === 'No' ? 'is' : opObj[filter.operator]} '${filter.value.val || filter.value.from}' ${filter.value.to ? "and '" + filter.value.to + "'" : ''}`;
      }
    })
  }

  assignDate(event, i, type) {
    this.filterArray[i].value[type] = event
  }

  assignDefaultFilter(i) {
    this.filterArray[i].operator = this.getFilterOptions(i)[0].value;
    this.assignValue(i);
  }

  assignValue(i) {
    if (this.definition.find(ele => ele.properties.dataPath === this.filterArray[i].path).type === 'Boolean') {
      this.filterArray[i].value = {
        val: this.filterArray[i].operator
      }
    }
  }

  toggleDatePicker(i, type) {
    if (type === 'from') {
      this.showFromDatePicker.fill(false).fill(!this.showFromDatePicker[i], i, i + 1)
    }
    else {
      this.showToDatePicker.fill(false).fill(!this.showToDatePicker[i], i, i + 1)
    }
    // this.showFromDatePicker[i]=!this.showFromDatePicker[i]
  }
  getFilterOptions(i) {
    return this.definition.find(ele => ele.properties.dataPath == this.filterArray[i].path)?.filterOptions || []
  }

  getFilterOptionsItem(def) {
    return this.definition.find(ele => ele.properties.dataPath == def.properties.dataPath)?.filterOptions
  }

  getType(i) {
    return this.definition.find(ele => ele.properties.dataPath == this.filterArray[i].path)?.type
  }
  getDateType(i) {
    return this.definition.find(ele => ele.properties.dataPath == this.filterArray[i].path)?.properties?.dateType?.split('-')?.[0] || 'date'
  }

  show(value) {
    return typeof value === 'string' ? value : JSON.stringify(value)
  }

  isValid() {
    const check = this.filterArray.map(ele => {
      if (['greaterThan', 'lesserThan'].includes(ele.operator) && (ele.value.from || ele.value.val)) {
        return true
      }
      if (ele.operator === 'inRange' && ele.value.from && ele.value.to) {
        return true
      }
      if (ele.value.val || ele.value.from) {
        return true
      }
      return false
    })
    if (check.filter(ele => !ele).length > 0) {
      return false
    }
    return true
  }
  onToggle(value) {
    this.alertModalRef = this.commonService.modal(this.alertModal, { centered: true });
    this.hold = true;
    this.alertModalRef.result.then(close => {
      if (close) {
        this.hold = false;
        this.advancedToggle = value;
        this.filterArray = [];
      }
      else {
        this.hold = false
        this.advancedToggle = !value
      }
    });
  }
}
