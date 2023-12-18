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
  showOptionsDropdown: Boolean = false;
  filterPayload:any;
  

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
    this.filterPayload={
      condition: '$and',
      rules:[]
    }
    this.definition.forEach(ele => {
      ele['filterOptions'] = this.setFilterTypeOptions(ele)
    });

    if(!_.isEmpty(this.currNode?.options?.filter)){
      this.filterPayload = this.convertToJSONStructure(_.cloneDeep(this.currNode?.options?.filter || {}))
    }
    // this.filterArray = this.convertToFilters(_.cloneDeep(this.currNode?.options?.filter?.$and || []))
    this.initialValue = _.cloneDeep(this.filterPayload)
    // if (this.filterArray.length === 0 && (Array.isArray(this.currNode?.options?.filter) ? this.currNode?.options?.filter.length > 0 : this.currNode.options.filter)) {
    //   this.advancedToggle = true
    // }
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
    this.filterPayload = this.initialValue;
    this.showFromDatePicker = [];
    this.showToDatePicker = [];
    this.toggle = false;
    this.advancedToggle = false
    this.toggleChange.emit(this.toggle);
  }

  // addCondition(op) {
  //   const filterObj = {
  //    operator: op,
  //    condition: {
  //     path: this.definition[0].properties.dataPath,
  //     operator: this.getFilterOptionsItem(this.definition[0])[0].value,
  //     value: {},
  //    }
  //   }
  //   this.showFromDatePicker[this.filterArray.length] = false;
  //   this.showToDatePicker[this.filterArray.length] = false;
  //   this.filterArray.push(filterObj);
  // }

  // removeCondition(i) {
  //   this.filterArray.splice(i, 1);
  //   this.showFromDatePicker.splice(i, 1);
  //   this.showToDatePicker.splice(i, 1);
  // }

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
      this.currNode.options.filterString = this.showFilterString();
      console.log(this.filterPayload)
      const finalPayload = this.convertToMongoFilter(this.filterPayload)
      this.valueChange.emit(finalPayload); this.toggle = false;
      this.toggleChange.emit(this.toggle);

    }

    this.advancedToggle = false

  }
  convertToMongoFilter(query) {
    if (!query || typeof query !== 'object') {
        return {};
    }

    const operatorsMap = {
        equals: '$eq',
        notEquals: '$ne',
        greaterThan: '$gt',
        lessThan: '$lt',
        contains: '$regex',
        notContains: '$not',
        Yes: 'Yes',
        No: 'No',
        
    };

    const conditionMap = {
        $and: '$and',
        $or: '$or',
    };
    let prefix = ['DATASERVICE_APPROVE', 'DATASERVCE_REJECT'].includes(this.currNode.type) ? 'data.new.' : '';

    if (['lastUpdated', 'createdAt'].includes(query.path)) {
          prefix = '_metadata.'
        }
    if (query.condition) {
        const condition = conditionMap[query.condition] || query.condition;
        const rules = query.rules.map(rule => this.convertToMongoFilter(rule));
        return { [condition]: rules };
    } else if (query.path && query.operator && query.value !== undefined) {
        const operator = operatorsMap[query.operator] || query.operator;
        if(query.operator == 'inRange'){
          return { [prefix+query.path.toString()]: { $gte: query.value.from, $lte: query.value.to } };
        }
        if(query.operator.toLowerCase().includes('contains')){
          const regex = { $regex: query.value?.val || query.value, $options: 'i' };
          return {[prefix+query.path.toString()]: (query.operator === 'contains' ? regex : {$not: regex})}
        }
        if (query.operator.includes('Than')) {
          return { [prefix+query.path.toString()]: { [operator]: (query['value']['val'] || query['value']['from']) } };
        }
        return { [prefix+query.path.toString()]: { [operator]: query.value.val || query.value.from || query.val } };
    }

    return {};
}


  // convertToFilters(queryArray) {
  //   let prefix = ['DATASERVICE_APPROVE', 'DATASERVCE_REJECT'].includes(this.currNode.type) ? 'data.new.' : ''
  //   const filters = [];

  //   queryArray.forEach(queryObject => {
  //     let path = Object.keys(queryObject)[0];
  //     if (path.startsWith('_metadata')) {
  //       prefix = '_metadata.'
  //     }
  //     const value = queryObject[path];
  //     path = path.replace(prefix, '');

  //     if (value.hasOwnProperty('$eq') || value.hasOwnProperty('$ne')) {
  //       const type = this.definition.find(ele => ele.properties.dataPath === path).type;
  //       const operator = value.hasOwnProperty('$eq') ? 'equals' : 'notEquals';
  //       const query = {
  //         path: path,
  //         operator: operator,
  //         value: type === 'Date' ? { from: value['$eq'] || value['$ne'] } : { val: value['$eq'] || value['$ne'] }
  //       };
  //       filters.push(query);
  //     } else if (value.hasOwnProperty('$regex') || value.hasOwnProperty('$not')) {
  //       const operator = value.hasOwnProperty('$regex') ? 'contains' : 'notContains';
  //       const query = {
  //         path: path,
  //         operator: operator,
  //         value: { val: value['$regex'] }
  //       };
  //       filters.push(query);
  //     } else if (value.hasOwnProperty('$gt') || value.hasOwnProperty('$lt')) {
  //       const operator = value.hasOwnProperty('$gt') ? 'greaterThan' : 'lessThan';
  //       const queryVal = value['$gt'] || value['$lt'];
  //       const finalQueryVal = typeof queryVal === 'number' ? { val: queryVal } : { from: queryVal, to: queryVal };
  //       const query = {
  //         path: path,
  //         operator: operator,
  //         value: finalQueryVal
  //       };
  //       filters.push(query);
  //     } else if (value.hasOwnProperty('$gte') && value.hasOwnProperty('$lte')) {
  //       const query = {
  //         path: path,
  //         operator: 'inRange',
  //         value: { from: value['$gte'], to: value['$lte'] }
  //       };
  //       filters.push(query);
  //     } else if (typeof value === 'boolean') {
  //       // const operator = value ? 'Yes' : 'No';
  //       const query = {
  //         path: path,
  //         operator: value ? 'Yes' : 'No',
  //         value: { val: value ? 'Yes' : 'No' }
  //       };
  //       filters.push(query);
  //     }
  //   });
  //   console.log(filters);
  //   return filters;
  // }

  convertToJSONStructure(mongoQuery) {
    const operatorsMap = {
        $eq: 'equals',
        $ne: 'notEquals',
        $gt: 'greaterThan',
        $lt: 'lessThan',
        $regex: 'contains',
        $not: 'notContains',
    };

    const conditionMap = {
        $and: '$and',
        $or: '$or',
    };
    let finalOperator = ''

    let prefix = ['DATASERVICE_APPROVE', 'DATASERVCE_REJECT'].includes(this.currNode.type) ? 'data.new.' : ''

    if (mongoQuery.$and || mongoQuery.$or) {
        const condition = Object.keys(mongoQuery)[0];
        const rules = mongoQuery[condition].map(rule => this.convertToJSONStructure(rule));
        return { condition: conditionMap[condition] || condition, rules };
    } else {
        let path = Object.keys(mongoQuery)[0];
        if (path.includes('_metadata')) {
          prefix = '_metadata.'
        }
        let operator = Object.keys(mongoQuery[path])[0];
        finalOperator = operatorsMap[operator];
        if(mongoQuery[path].hasOwnProperty('$gte') && mongoQuery[path].hasOwnProperty('$lte')){
          finalOperator = 'inRange'
        }
        let value = mongoQuery?.[path]?.[operator];
        path=path.replace(prefix,'')
        const type = this.definition.find(ele => ele.properties.dataPath === path).type;
        if(type === 'Date'){
          value = finalOperator === 'inRange' ? {from: mongoQuery[prefix+path]['$gte'], to: mongoQuery[prefix+path]['$lte']} : {from: value}
        }
        else if(typeof mongoQuery[prefix+path] === 'boolean'){
          finalOperator = mongoQuery[prefix+path] ? 'Yes' : 'No';
          value = {val: mongoQuery[prefix+path] ? 'Yes' : 'No'}
        } 
        else {
          value = {val: value}
        }
        return { path, operator: finalOperator || operator, value };
    }
    
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

  assignDate(event, obj, type) {
    obj.value[type] = event
  }

  assignDefaultFilter(obj) {
    obj.operator = this.getFilterOptions(obj)[0].value;
    this.assignValue(obj);
  }

  assignValue(obj) {
    if (this.definition.find(ele => ele.properties.dataPath === obj.path).type === 'Boolean') {
      obj.value = {
        val: obj.operator
      }
    }
  }

  toggleDatePicker() {
   this.removeAllDatePickers(this.filterPayload);
  }

   accessNestedLevel(array, level) {
    if (level === 0) {
      return array;
  } else {
      let result = [];
      array.forEach(obj => {
          if (obj.rules) {
              result = result.concat(this.accessNestedLevel(obj.rules, level - 1));
          }
      });
      return result;
  }
    
}

  removeAllDatePickers(data){
    data.rules.forEach((ele)=>{
      if(ele.path){
        ele.showFromDatePicker = false;
        ele.showToDatePicker = false;
      }
      else if(ele.rules){
        this.removeAllDatePickers(ele);
      }
     })
  }
  getFilterOptions(obj) {
    return this.definition.find(ele => ele.properties.dataPath == obj.path)?.filterOptions || []
  }

  getFilterOptionsItem(def) {
    return this.definition.find(ele => ele.properties.dataPath == def.properties.dataPath)?.filterOptions
  }

  getType(obj) {
    return this.definition.find(ele => ele.properties.dataPath == obj.path)?.type
  }
  getDateType(obj) {
    return this.definition.find(ele => ele.properties.dataPath == obj.path)?.properties?.dateType?.split('-')?.[0] || 'date'
  }

  show(value) {
    return typeof value === 'string' ? value : JSON.stringify(value)
  }

  isValid() {
    return true
    // const check = this.filterArray.map(obj => {
    //   const ele = obj.condition;
    //   if (['greaterThan', 'lesserThan'].includes(ele.operator) && (ele.value.from || ele.value.val)) {
    //     return true
    //   }
    //   if (ele.operator === 'inRange' && ele.value.from && ele.value.to) {
    //     return true
    //   }
    //   if (ele.value.val || ele.value.from) {
    //     return true
    //   }
    //   return false
    // })
    // if (check.filter(ele => !ele).length > 0) {
    //   return false
    // }
    // return true
  }
  onToggle(value) {
    this.alertModalRef = this.commonService.modal(this.alertModal, { centered: true });
    this.hold = true;
    this.alertModalRef.result.then(close => {
      if (close) {
        this.hold = false;
        this.advancedToggle = value;
        this.filterPayload = [];
      }
      else {
        this.hold = false
        this.advancedToggle = !value
      }
    });
  }
  
  addCondition(ruleObj){
    const obj = {
      path: this.definition[0].properties.dataPath,
      operator: this.getFilterOptionsItem(this.definition[0])[0].value,
      value: {},
      showToDatePicker: false,
      showFromDatePicker: false
    }

    ruleObj.rules.push(obj)
  }
  
  removeRule(i, obj){
    obj?.rules?.splice(i,1);
  }

  addRuleSet(ruleObj){
    const obj = {
      condition: '$and',
      rules:[{
        path: this.definition[0].properties.dataPath,
        operator: this.getFilterOptionsItem(this.definition[0])[0].value,
        value: {},
      }]
    }
    ruleObj.rules.push(obj);
  }

  removeRuleSet(i, obj){
    obj?.rules?.splice(i,1);
  }

  switchCondition(obj,value){
    obj.condition = value;
  }
}
