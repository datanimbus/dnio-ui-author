import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { CommonService } from 'src/app/utils/services/common.service';
import { B2bFlowService } from '../../b2b-flow.service';

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
  suggestions: Array<any> = [];
  listToggle: boolean= false;
  sources : Array<any> = [];
  currentSource: any = {};
  

  constructor(private commonService: CommonService, private flowService: B2bFlowService) {
    this.alertModalData = {
      title: 'Are you sure you want to toggle filter?',
      message: 'This action will result in losing all the changes you have made on the filter.',
    }
  }
  isEmpty= _.isEmpty

  ngOnInit(): void {
    this.definition = this.createDefinition(this.currNode?.options?.dataService?.definition || []);
    this.definition = this.definition.concat(this.addAdditionalDef())
    this.advancedToggle = this.currNode.options.isAdvancedFilter || false;
    this.filterPayload= this.currNode.options.filter || {
      condition: '$and',
      conditions:[]
    }
    this.definition.forEach(ele => {
      ele['filterOptions'] = this.setFilterTypeOptions(ele)
    });

    this.currNode.options.filterString = this.advancedToggle ? this.filterPayload : this.showFilterString();
    if(!_.isEmpty(this.currNode?.options?.filter) && !this.advancedToggle){
      this.filterPayload = this.convertToJSONStructure(_.cloneDeep(this.currNode?.options?.filter || {}))
    }
    // this.filterArray = this.convertToFilters(_.cloneDeep(this.currNode?.options?.filter?.$and || []))
    this.initialValue = _.cloneDeep(this.filterPayload)
    // if (this.filterArray.length === 0 && (Array.isArray(this.currNode?.options?.filter) ? this.currNode?.options?.filter.length > 0 : this.currNode.options.filter)) {
    //   this.advancedToggle = true
    // }
    this.sources = this.transform(this.getAllSources())
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
    this.listToggle=false;
    this.toggle = false;
    this.advancedToggle = false
    this.toggleChange.emit(this.toggle);
  }

  setFilterTypeOptions(item: any) {
    // if (item.type === 'Date') {
    //   return [
    //     { name: 'Equals', value: 'equals' },
    //     { name: 'Greater than', value: 'greaterThan' },
    //     { name: 'Less than', value: 'lessThan' },
    //     { name: 'In range', value: 'inRange' }
    //   ];
    // } else if (item.type === 'Number') {
    //   return [
    //     { name: 'Equals', value: 'equals' },
    //     { name: 'Greater than', value: 'greaterThan' },
    //     { name: 'Less than', value: 'lessThan' },
    //     { name: 'Not equal', value: 'notEquals' },
    //     { name: 'In range', value: 'inRange' }
    //   ];
    // } else if (item.type === 'Boolean') {
    //   return [
    //     // { name: 'Select', value: '' },
    //     { name: 'Yes', value: 'Yes' },
    //     { name: 'No', value: 'No' }
    //   ];
    // } else {
    //   return [
    //     { name: 'Equals', value: 'equals' },
    //     { name: 'Not equal', value: 'notEquals' },
    //     { name: 'Contains', value: 'contains' },
    //     { name: 'Does not contain', value: 'notContains' }
    //   ];
    return [ { name: 'Equals', value: 'equals' },
        { name: 'Not equal', value: 'notEquals' },
        { name: 'Contains', value: 'contains' },
        { name: 'Does not contain', value: 'notContains' },
        { name: 'Greater than', value: 'greaterThan' },
        { name: 'Less than', value: 'lessThan' },
        { name: 'In range', value: 'inRange' }
      ]
  }

  done() {
    this.currNode.options.isAdvancedFilter = this.advancedToggle;
    if (this.advancedToggle) {

      this.value = this.filterPayload
      this.valueChange.emit(this.value);
      this.listToggle=false;
      this.toggle = false;
      this.toggleChange.emit(this.toggle);
    }
    else {
      // this.currNode.options.filterString = this.showFilterString();
      const finalPayload = this.convertToMongoFilter(this.filterPayload)
      this.valueChange.emit(finalPayload); 
      this.listToggle = false;
      this.toggle = false;
      this.toggleChange.emit(this.toggle);

    }

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
        const conditions = query.conditions.map(rule => this.convertToMongoFilter(rule));
        return { [condition]: conditions };
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
        const conditions = mongoQuery[condition].map(rule => this.convertToJSONStructure(rule));
        return { condition: conditionMap[condition] || condition, conditions };
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
        const type = this.definition.find(ele => ele.properties.dataPath === path)?.type || '';
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
      'equals': '==',
      'notEquals': '!=',
      'greaterThan': '>',
      'lesserThan': '<',
      'contains': 'contains',
      'notContains': 'does not contain',
      '$and': '&&',
      '$or': '||',
      'Yes': '==',
      'No': '==',
      'inRange': '>='
    }
    const condition = this.filterPayload?.condition || ''
    if(condition && this.filterPayload?.conditions && !this.advancedToggle){
      let str = ''
      for (const ele of this.filterPayload.conditions) {
        if (ele.path) {
          str = `${ele.path} ${opObj[ele.operator]} ${ele.value.val || ele.value.from || ele.value.to} ${opObj[condition]} ...`;
          return str;
        }
      }
      return str;
    }
    else if(this.advancedToggle){
      return this.filterPayload.toString().length > 100 ? this.filterPayload.toString().substring(0, 100) + '...' : this.filterPayload.toString()
    }
    else{
      return ''
    }
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
    else{
      obj['value']['val'] = null
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
          if (obj.conditions) {
              result = result.concat(this.accessNestedLevel(obj.conditions, level - 1));
          }
      });
      return result;
  }
    
}

  removeAllDatePickers(data){
    data.conditions.forEach((ele)=>{
      if(ele.path){
        ele.showFromDatePicker = false;
        ele.showToDatePicker = false;
      }
      else if(ele.conditions){
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
    return this.isValidPayload(this.filterPayload)
  }

  isValidPayload(obj) {
    if(this.advancedToggle){
      return true
    }
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    if (obj.hasOwnProperty('conditions')) {
        if (!Array.isArray(obj.conditions) || obj.conditions.length === 0) {
            return false;
        }
        for (let rule of obj.conditions) {
            if (!this.isValidPayload(rule)) {
                return false;
            }
        }
    }
    if (obj.hasOwnProperty('value')) {
        let value = obj.value;
        if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
            return false;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return false;
        }
    }

    return true;
}
  onToggle(value) {
    this.alertModalRef = this.commonService.modal(this.alertModal, { centered: true });
    this.hold = true;
    this.alertModalRef.result.then(close => {
      if (close) {
        this.hold = false;
        this.advancedToggle = value;
        this.filterPayload =  this.advancedToggle ? [] : {
          condition: '$and',
          conditions:[]
        };
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

    ruleObj.conditions.push(obj)
  }
  
  removeRule(i, obj){
    obj?.conditions?.splice(i,1);
  }

  addRuleSet(ruleObj){
    const obj = {
      condition: '$and',
      conditions:[{
        path: this.definition[0].properties.dataPath,
        operator: this.getFilterOptionsItem(this.definition[0])[0].value,
        value: {},
      }]
    }
    ruleObj.conditions.push(obj);
  }

  removeRuleSet(i, obj){
    obj?.conditions?.splice(i,1);
  }

  switchCondition(obj,value){
    obj.condition = value;
  }


  getAllSources(){
    const currNode = this.currNode
    const list = currNode ? this.flowService.getNodesBefore(currNode) : [];
    const temp = list.map(node => {
      let list = [];

      if (node.dataStructure?.outgoing?.definition) {
        list = list.concat(this.getNestedSuggestions(node, node.dataStructure.outgoing.definition));
      }
      return list;
    })
    return _.flatten(temp);
  }

  getNestedSuggestions(node: any, definition: Array<any>, parentKey?: any, parentDef?: any) {
    let list = [];
    if (definition && definition.length > 0) {
      definition.forEach((def: any) => {
        def.depth = parentDef ? parentDef.depth + 1 : 0;
        let key = def.properties?.dataPathSegs?.join('.') || def.key;
        if (def.type == 'Object') {
          list = list.concat(this.getNestedSuggestions(node, def.definition, key, def));
        } else {
          let item: any = {};
          const label = key.split('.').pop()
          item.label = label == '_id' ? 'ID' : label.charAt(0).toUpperCase() + label.slice(1);
          item.value = node._id + '.responseBody.' + key;
          item.nodeId = node._id;
          item.name = node.name;
          item.def=def;
          list.push(item);
        }
      });
    }
    return list;
  }

 transform(input){
  const result = {};

  input.forEach(item => {
    const { nodeId, name, label, value, def } = item;

    if (!result[nodeId]) {
      result[nodeId] = { keys: [], name: name };
    }

    result[nodeId].keys.push({ label, value, def });
  });

  // Convert the result object into an array
  const outputArray = Object.keys(result).map(nodeId => ({
    nodeId,
    name: result[nodeId].name,
    keys: result[nodeId].keys,
    collapsed: false
  }));

  return outputArray;
 }


 onBasicDrop(event: any, obj, type = 'val') {
  console.log(this.currentSource.value);
  obj['value'][type] = `{{${this.currentSource.value}}}`
}

onSourceDrag(event: any, item: any) {
  this.currentSource = item;
}

getNodeDataType(source: any) {
  const list = this.currNode ? this.flowService.getNodesBefore(this.currNode) : [];
  const node = list.find(ele => ele._id==source.nodeId)
  if (node.dataStructure && node.dataStructure?.outgoing && node.dataStructure?.outgoing?._id) {
    if (node.dataStructure.outgoing._id.startsWith('SRVC')) {
      return 'Array';
    } else {
      return node.dataStructure?.outgoing?.type || 'Object';
    }
  }
  return 'Object';
}

toggleSource(nodeId: any) {
  const node = this.sources.find(ele => ele.nodeId == nodeId)
  node.collapsed = !node.collapsed
}

 get secondCss(){
  const width = document.getElementById('main').offsetWidth;
  return width+'px';
 }

}
