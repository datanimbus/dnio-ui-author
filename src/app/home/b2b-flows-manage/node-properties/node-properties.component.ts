import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';

import { AppService } from 'src/app/utils/services/app.service';
import { CommonService, GetOptions } from 'src/app/utils/services/common.service';
import { environment } from 'src/environments/environment';
import { B2bFlowService } from '../b2b-flow.service';
import { OperatorFunction, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'odp-node-properties',
  templateUrl: './node-properties.component.html',
  styleUrls: ['./node-properties.component.scss'],
})
export class NodePropertiesComponent implements OnInit {

  @Input() edit: any;
  @Input() flowData: any;
  @Input() currNode: any;
  @Input() nodeList: Array<any>;
  @Output() close: EventEmitter<any>;
  @Output() changesDone: EventEmitter<any>;
  alertModal: {
    statusChange?: boolean;
    title: string;
    message: string;
  };
  openDeleteModal: EventEmitter<any>;
  prevNode: any;
  toggle: any;
  nodeNameErrorMessage: string;
  searchTerm: string;
  path: string;
  @Input() processNodeList: any = [];
  activeTab: number;
  nodeType: any;
  constructor(private commonService: CommonService,
    private appService: AppService,
    private flowService: B2bFlowService) {
    this.edit = { status: false };
    this.close = new EventEmitter();
    this.changesDone = new EventEmitter();
    this.toggle = {};
    this.activeTab = 0;
    this.alertModal = {
      statusChange: false,
      title: '',
      message: ''
    };
    this.openDeleteModal = new EventEmitter();
  }

  ngOnInit(): void {
    this.prevNode = this.nodeList.find(e => (e.onSuccess || []).findIndex(es => es._id == this.currNode._id) > -1);
    if (this.prevNode && !this.prevNode.dataStructure) {
      this.prevNode.dataStructure = {};
    }
    if (this.prevNode && this.prevNode.dataStructure && !this.prevNode.dataStructure.outgoing) {
      this.prevNode.dataStructure.outgoing = {};
    }
    if (this.currNode && !this.currNode.dataStructure) {
      this.currNode.dataStructure = {};
    }
    if (this.currNode && this.currNode.dataStructure && !this.currNode.dataStructure.outgoing) {
      this.currNode.dataStructure.outgoing = {};
    }
    if (this.currNode && !this.currNode.options) {
      this.currNode.options = {};
    }
    if (this.currNode && !this.currNode.options.retry) {
      this.currNode.options.retry = {};
    }
    if (this.currNode && !this.currNode.options.conditionType) {
      this.currNode.options.conditionType = 'ifElse';
    }
    const options: GetOptions = {
      filter: {
        app: this.commonService.app._id
      },
      sort: '-_metadata.lastUpdated',
      select: 'agentId'
    }
    this.commonService.get('partnerManager', `/${this.commonService.app._id}/agent`, options).subscribe(res => {
      if (res) {
        const selected = this.currNode.options.agents;
        this.currNode.options.agents = [];
        res.some(r => selected?.find(e => {
          if (e._id == r._id) {
            this.currNode.options.agents.push(e)
          }
        }
        ))
      }
    });

    if (this.flowData?.inputNode?.type === 'FILE') {
      this.flowData.inputNode.options['contentType'] = 'multipart/form-data'
    }

    this.checkType()
  }

  checkType() {
    switch (this.currNode.type) {
      case 'DATASERVICE':
        if (this.currNode.options.get) {
          this.nodeType = 'DS_GET';
        }
        if (this.currNode.options.delete) {
          this.nodeType = 'DS_DELETE';
        }
        if (this.currNode.options.insert) {
          this.nodeType = 'DS_INSERT';
        }
        if (this.currNode.options.update) {
          this.nodeType = 'DS_UPDATE';
        }
        break;
      case 'CONNECTOR':
        const connectorType = this.currNode.options.connectorType;
        if (!connectorType) {
          this.getConnectorType();
        } else {
          this.nodeType = `CON_${connectorType.toUpperCase()}`;
        }
        if (this.currNode.options.read) {
          this.nodeType = 'SFTP_READ';
        }
        if (this.currNode.options.write) {
          this.nodeType = 'SFTP_WRITE';
        }
        if (this.currNode.options.move) {
          this.nodeType = 'SFTP_MOVE';
        }
        if (this.currNode.options.list) {
          this.nodeType = 'SFTP_LIST';
        }
        break;
      default:
        this.nodeType = this.currNode.type;
    }
  }

  getConnectorType(){
    const connector = this.currNode.options?.connector?._id || '';
    if(connector){
      this.commonService.get('user', `/${this.commonService.app._id}/connector/${connector}`,{
        select: 'category'
      }).subscribe(res => {
        this.currNode.options.connectorType = res.category;
        this.nodeType = res.category ? `CON_${res.category.toUpperCase()}` : 'CON_DB'
      })
    }
  }
  

  enableEditing() {
    this.edit.status = true;
  }

  confirmNodeDeletion() {
    this.alertModal.statusChange = false;
    this.alertModal.title = 'Delete Node?';
    this.alertModal.message =
      `Are you sure you want to delete this node? This action will delete: ${this.currNode.name}`;
    this.openDeleteModal.emit(this.alertModal);
  }

  deleteNode() {
    if (this.prevNode) {
      const prevIndex = this.nodeList.findIndex(e => e._id == this.prevNode._id);
      if (prevIndex > -1) {
        const nextIndex = this.nodeList[prevIndex].onSuccess.findIndex(e => e._id == this.currNode._id);
        if (nextIndex > -1) {
          this.nodeList[prevIndex].onSuccess.splice(nextIndex, 1);
        }
      }
    }
    const currIndex = this.nodeList.findIndex(e => e._id == this.currNode._id);
    if (currIndex > -1) {
      this.nodeList.splice(currIndex, 1);
    }
    if (!environment.production) {
      console.log(this.nodeList);
    }
    this.flowService.reCreatePaths.emit();
    this.close.emit(false);
    this.flowService.selectedNode.emit(null);
  }

  closeDeleteModal(data) {
    if (data != null) {
      this.deleteNode();
    }
  }

  onTypeChange(type: string) {
    if (!environment.production) {
      console.log(type);
    }
    this.currNode.options = { retry: {} };
    this.currNode.mappings = [];
    this.currNode.type = type;
    this.currNode.options = {
      method: 'POST',
      headers: {},
      contentType: 'application/json'
    };

    // if (type == 'DATASERVICE') {
    //   this.currNode.options.update = true;
    //   this.currNode.options.insert = true;
    // }

    if (type.startsWith('DS_')) {
      this.currNode.type = 'DATASERVICE';
      const options = ['get', 'insert', 'update', 'delete'];
      options.forEach(item => {
        this.currNode.options[item.toLowerCase()] = false
      })
      const subType = type.split('_')[1];
      this.currNode.options[subType.toLowerCase()] = true;
      this.currNode.options.retry = {
        count: '',
        interval: ''
      }
    }

    if(type.startsWith('CON_')){
      this.currNode.type = 'CONNECTOR';
      const connectorType = type.split('_')[1];
      this.currNode.options['connectorType'] = connectorType;
    }

    if (type == 'FOREACH' || type == 'REDUCE') {
      this.currNode.options.startNode = null;
    }

    if (type == 'CODEBLOCK') {
      const tempCode = [];
      tempCode.push('//use logger for logging');
      tempCode.push('async function execute(context, node) {');
      tempCode.push('\ttry {');
      tempCode.push('\t\t//Write Your code here');
      tempCode.push('\t\t');
      tempCode.push('\t\treturn context;');
      tempCode.push('\t} catch(err) {');
      tempCode.push('\t\tlogger.error(err);');
      tempCode.push('\t\tthrow err;');
      tempCode.push('\t}');
      tempCode.push('}');
      this.currNode.options.code = tempCode.join('\n');
    }

    this.changesDone.emit()
  }

  onFormatChange(data: any, type: string) {
    if (!environment.production) {
      console.log(data, type);
    }
    if (!this.currNode.dataStructure) {
      this.currNode.dataStructure = {};
    }

    if (type == 'incoming') {
      this.currNode.dataStructure.incoming = data;
    }

    if (type == 'outgoing') {
      this.currNode.dataStructure.outgoing = data;
    }

    this.currNode.mappings = [];
    (this.currNode.onSuccess || []).forEach(item => {
      const temp = this.nodeList.find(r => r._id == item._id);
      if (temp && temp.type == 'MAPPING') {
        temp.mappings = [];
      }
    })
    this.changesDone.emit();
    this.flowService.dataStructureSelected.emit({ currNode: this.currNode, type });
  }

  cancel() {
    this.close.emit(false);
  }

  selectDataService(data: any) {
    this.currNode.dataStructure.outgoing = data;
  }

  selectAgent(data: any) {
    if (!this.currNode.options.agents) {
      this.currNode.options.agents = [];
    }
    const index = this.currNode.options.agents.findIndex(e => e._id == data._id);
    if (index == -1) {
      this.currNode.options.agents.push(data);
    }
    this.toggle['agentSelector'] = false;
    this.changesDone.emit()
  }

  removeAgent(data: any) {
    const index = this.currNode.options.agents.findIndex(e => e._id == data._id);
    if (index > -1) {
      this.currNode.options.agents.splice(index, 1);
    }
    this.changesDone.emit()
  }

  setFunctionEndpoint(data: any) {
    this.currNode.options.path = `/${this.commonService.app._id}/${this.appService.toCamelCase(data.name)}`
    this.changesDone.emit()
  }

  nodeNameChanged(value: string) {
    const oldId = this.currNode._id;
    const newId = _.snakeCase(value);
    // this.currNode._id = newId;
    let regex = new RegExp(`${oldId}`, 'g');
    let replacer = newId;
    console.log(regex, replacer);
    this.nodeList.forEach((item) => {
      let temp = this.appService.cloneObject(item);
      delete temp.dataStructure;
      let content = JSON.stringify(temp);
      let fixedNode = JSON.parse(content.replace(regex, replacer));
      _.merge(item, fixedNode);
    });
    this.flowService.reCreatePaths.emit();
    // content = _.replace(content, regex, replacer);
    // content = content.replace(regex, replacer);
    // console.log(content);
    // JSON.parse(content);
    // console.log(JSON.stringify(this.nodeList), oldId, newId);
  }


  checkNameForUnique(value: string) {
    this.nodeNameErrorMessage = '';
    if (!value) {
      this.nodeNameErrorMessage = 'Node name cannot be empty.';
      return;
    }
    const matchDocs = this.flowService.nodeList.filter(e => e._id != this.currNode._id && _.camelCase(e.name) == _.camelCase(value));
    if (matchDocs && matchDocs.length > 0) {
      this.nodeNameErrorMessage = 'Duplicate node name.';
    }
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

  onValueChange(value: any) {
    this.currNode.options.url = value;
  }

  onPathAdd() {
    const type = this.isInputNode ? 'inputDirectories' : 'outputDirectories'
    const directories = this.currNode.options?.[type] ? _.cloneDeep(this.currNode.options[type]) : [];
    const pathObj = {
      path: this.path,
      watchSubDirectories: false
    }
    directories.push(pathObj);

    this.path = '';
    this.currNode.options[type] = directories;
    this.changesDone.emit();
  }

  removePath(index) {
    this.currNode.options[this.isInputNode ? 'inputDirectories' : 'outputDirectories'].splice(index, 1);
  }

  toggleWatch(i) {
    const type = this.isInputNode ? 'inputDirectories' : 'outputDirectories'
    this.currNode.options[type][i].watchSubDirectories = !this.currNode.options[type][i].watchSubDirectories;
  }

  get variableSuggestions() {
    return this.flowService.getSuggestions(this.currNode)
  }


  get isInputNode() {
    if (this.flowData && this.currNode) {
      return this.flowData.inputNode._id == this.currNode._id;
    }
    return true;
    // return this.nodeList[0]._id == this.currNode._id;
  }
  get showDataMapping() {
    if (this.flowData && this.currNode && this.prevNode) {
      // return !_.isEmpty(this.prevNode.dataStructure?.outgoing);
      return true;
    }
    return false;
    // return this.nodeList[0]._id == this.currNode._id;
  }

  get showInputSelector() {
    if (this.isInputNode) {
      return false;
    }
    if (this.currNode.type == 'ERROR') {
      return false;
    }
    if (this.currNode.type == 'DATASERVICE') {
      return false;
    }
    if (this.currNode.type == 'CONDITION') {
      return false;
    }
    if (this.currNode.type == 'CONVERT_JSON_JSON'
      || this.currNode.type == 'CONVERT_JSON_XML'
      || this.currNode.type == 'CONVERT_XML_JSON'
      || this.currNode.type == 'CONVERT_JSON_CSV'
      || this.currNode.type == 'CONVERT_CSV_JSON') {
      return false;
    }
    return true;
  }

  get checkForFileOptions() {
    let flag = false;
    if (this.currNode.type == 'FILE') {
      flag = true;
    } else if (this.currNode.type == 'API' && this.currNode.options.contentType == 'multipart/form-data') {
      flag = true;
    }
    if (flag && (this.currNode?.dataStructure?.outgoing?.formatType === 'EXCEL'
      || this.currNode?.dataStructure?.outgoing?.formatType === 'CSV'
      || this.currNode?.dataStructure?.outgoing?.formatType === 'DELIMITER')) {
      flag = true;
    } else {
      this.currNode.options['skipLines'] = null;
      this.currNode.options['skipRows'] = null;
      this.currNode.options['maxRows'] = null;
      flag = false
    }
    return flag;
  }

  get showOutputSelector() {
    return this.currNode.type != 'ERROR'
      && this.currNode?.type != 'DATASERVICE'
      && this.currNode?.type != 'MAPPING'
      && this.currNode?.type != 'DEDUPE'
      && this.currNode?.type != 'CONFLICT'
      && this.currNode?.type != 'FILE_WRITE'
      && this.currNode?.type != 'TIMER'
      && this.currNode?.type != 'RESPONSE'
      && this.currNode?.type != 'CONDITION'
      && this.currNode.type != 'CONVERT_JSON_JSON'
      && this.currNode.type != 'CONVERT_JSON_XML'
      && this.currNode.type != 'CONVERT_XML_JSON'
      && this.currNode.type != 'CONVERT_JSON_CSV'
      && this.currNode.type != 'CONVERT_CSV_JSON'
      && (this.currNode.type !== 'FILE' || this.isInputNode)
  }

  get processFlowNode() {
    return this.currNode?.type === 'SYSTEM'
      || this.currNode?.type === 'USER'
      || this.currNode?.type === 'DECISION'
      || this.currNode?.type === 'EVENT'

  }

  get dropDownLabel() {
    const obj = {
      'SYSTEM': 'System Task',
      'USER': 'User Task',
      'EVENT': 'Event Trigger',
    }

    return obj[this.currNode?.type]
  }

  nodesFromType(type) {
    return this.processNodeList.filter(node => node.type === type)
  }
}
