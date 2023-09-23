import { EventEmitter, Injectable } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import * as _ from 'lodash';
import * as uuid from 'uuid/v1';
import { B2bPathService } from './b2b-path.service';

@Injectable({
  providedIn: 'root'
})
export class B2bFlowService {

  showAddNodeDropdown: EventEmitter<any>;
  selectedNode: EventEmitter<any>;
  deleteNode: EventEmitter<any>;
  reCreatePaths: EventEmitter<any>;
  selectedPath: EventEmitter<any>;
  anchorSelected: any;
  nodeLabelMap: any;
  dataStructureSelected: EventEmitter<any>;
  nodeList: Array<any>;
  nodeIDCounter: number;
  constructor(private appService: AppService,
    private pathService: B2bPathService) {
    this.showAddNodeDropdown = new EventEmitter();
    this.selectedNode = new EventEmitter();
    this.deleteNode = new EventEmitter();
    this.reCreatePaths = new EventEmitter();
    this.selectedPath = new EventEmitter();
    this.dataStructureSelected = new EventEmitter();
    this.nodeLabelMap = {
      FILE: 'File Agent',
      API_XML: 'API XML',
      API_FILE: 'API Multipart Upload',
      TIMER: 'Timer',
      CODEBLOCK: 'Code Block',
      CONNECTOR: 'Connector',
      DATASERVICE: 'Data Service',
      FUNCTION: 'Function',
      MAPPING: 'Mapping',
      TRANSFORM: 'Transform',
      DEDUPE: 'De-Dupe',
      CONFLICT: 'Conflict',
      FOREACH: 'For Each',
      PLUGIN: 'Plugin',
      REDUCE: 'Reduce',
      UNWIND: 'Change Root',
      RESPONSE: 'Response',
      ERROR: 'Global Error',
      FILE_READ: 'File Reader',
      FILE_WRITE: 'File Writer',
      PARSE_JSON: "Parse JSON",
      PARSE_XML: "Parse XML",
      PARSE_CSV: "Parse CSV",
      CONVERT_JSON_JSON: "Converter",
      CONVERT_JSON_XML: "Converter",
      CONVERT_XML_JSON: "Converter",
      CONVERT_JSON_CSV: "Converter",
      CONVERT_CSV_JSON: "Converter",
      CONDITION: 'Condition',
      SYSTEM: 'System Task',
      USER: 'User Task',
      EVENT: 'Event Trigger',
      DECISION: 'Decision',
    };
    this.nodeList = [];
    this.nodeIDCounter = 0;
  }

  getNodeType(node: any, isInputNode?: boolean) {
    switch (node.type) {
      case 'API':
        if (isInputNode) {
          switch (node?.options?.contentType) {
            case 'multipart/form-data':
              return 'API File Receiver';
            case 'application/xml':
              return 'API XML Receiver';
            default:
              return 'API JSON Receiver';
          }
        } else {
          return 'API JSON';
        }
      case 'CONNECTOR':
        if (node.options.connectorType === 'SFTP') {
          if (node.options.read) {
            return 'SFTP Read';
          } else if (node.options.list) {
            return 'SFTP List';
          } else if (node.options.move) {
            return 'SFTP Move';
          } else {
            return 'SFTP Write';
          }
        } else {
          return this.nodeLabelMap[node.type] || node.type;
        }
      case 'DATASERVICE':
        if (node.options.approve) {
          return 'Data Service Approve';
        } else if (node.options.reject) {
          return 'Data Service Reject';
        } else if (node.options.insert) {
          return 'Data Service Create';
        } else if (node.options.delete) {
          return 'Data Service Delete';
        } else if (node.options.update) {
          return 'Data Service Update';
        } else {
          return 'Data Service Fetch';
        }
      case 'PROCESS':
        return 'Starter Node';
      case 'CONDITION':
        return 'Condition';
      default:
        return this.nodeLabelMap[node.type] || node.type;
    }
  }

  parseDynamicValue(value: any) {
    const configuredData: any = {};
    if (typeof value == 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const segments = value.split('.');
      let nodeSeg = segments[0];
      let nodeKeySeg = segments[1];
      let dateKeySeg = segments.splice(2).join('.');
      configuredData.node = nodeSeg.split('').slice(2, nodeSeg.length).join('');
      if (configuredData.node.startsWith('node[')) {
        configuredData.node = configuredData.node.split('').slice(6, configuredData.node.length - 2).join('');
      }
      if (dateKeySeg) {
        configuredData.nodeKey = nodeKeySeg;
        configuredData.dataKey = dateKeySeg.split('').slice(0, dateKeySeg.length - 2).join('');
      } else {
        configuredData.nodeKey = nodeKeySeg.split('').slice(0, nodeKeySeg.length - 2).join('');
      }
    }
    // else if (typeof value == 'string' && value.startsWith('node[')) {
    //   const charArr = value.split('');
    //   configuredData.node = charArr.slice(6, 12).join('');
    //   const nodeKeyIndexes = charArr.map((e, i) => e == '.' ? i : null).filter(e => e);
    //   if (nodeKeyIndexes.length == 1) {
    //     configuredData.nodeKey = charArr.slice(nodeKeyIndexes[0] + 1, charArr.length).join('');
    //   } else {
    //     configuredData.nodeKey = charArr.slice(nodeKeyIndexes[0] + 1, nodeKeyIndexes[1]).join('');
    //     configuredData.dataKey = charArr.slice(nodeKeyIndexes[1] + 1, charArr.length).join('');
    //   }
    // } 
    else {
      configuredData.customValue = value;
    }
    return configuredData;
  }

  getDynamicLabel(configuredData: any, nodeList: Array<any>) {
    let text = configuredData.customValue || '';
    if (configuredData && configuredData.node) {
      const nodeData = nodeList.find(e => e._id == configuredData.node);
      if (!nodeData) {
        return text;
      }
      text += nodeData.name || nodeData._id;
    }
    if (configuredData && configuredData.nodeKey) {
      text += '<span class="font-16">/</span>' + configuredData.nodeKey;
    }
    if (configuredData && configuredData.dataKey) {
      text += '<span class="font-16">/</span>' + configuredData.dataKey;
    }
    return text;
  }

  getDynamicValue(configuredData: any) {
    let text = configuredData.customValue || '';
    if (configuredData && configuredData.node) {
      text += `${configuredData.node}`;
    }
    if (configuredData && configuredData.nodeKey) {
      text += '.' + configuredData.nodeKey;
    }
    if (configuredData && configuredData.dataKey) {
      text += '.' + configuredData.dataKey;
    }
    return text;
  }

  getDynamicName(configuredData: any, nodeList: Array<any>) {
    let text = configuredData.customValue || '';
    if (configuredData && configuredData.node) {
      const nodeData = nodeList.find(e => e._id == configuredData.node);
      if (!nodeData) {
        return text;
      }
      text += nodeData.name || nodeData._id;
    }
    if (configuredData && configuredData.nodeKey) {
      text += '/' + configuredData.nodeKey;
    }
    if (configuredData && configuredData.dataKey) {
      text += '/' + configuredData.dataKey;
    }
    return text;
  }

  getNodeObject(type: string, nodeList: Array<any>, anotherInputNode: boolean = false) {
    if (this.nodeIDCounter == 0) {
      this.nodeIDCounter = this.nodeList.length;
    }
    this.nodeIDCounter++;
    let defaultName = this.getNodeType({ type, contentType: 'application/json' }, anotherInputNode) + ' ' + this.nodeIDCounter;
    while (nodeList.findIndex(e => e._id == _.snakeCase(defaultName)) > -1) {
      this.nodeIDCounter++;
      defaultName = this.getNodeType({ type, contentType: 'application/json' }, anotherInputNode) + ' ' + this.nodeIDCounter;
    }
    const temp: any = {
      // _id: this.appService.getNodeID(allIds),
      _id: _.snakeCase(defaultName),
      name: defaultName,
      type: type,
      onSuccess: [],
      onError: [],
      options: {
        method: 'POST',
        headers: {},
        contentType: 'application/json'
      },
      dataStructure: {
        outgoing: {}
      }
    };
    if (type.startsWith('DS_')) {
      temp.type = 'DATASERVICE';
      const subType = type.split('_')[1];
      temp.options[subType.toLowerCase()] = true
    }

    if (type.startsWith('WF_')) {
      const subType = type.split('_')[1];
      temp.type = 'DATASERVICE_' + subType
    }

    if (type.startsWith('SFTP_')) {
      temp.type = 'CONNECTOR';
      temp.options.connectorType = 'SFTP';
      const subType = type.split('_')[1];
      temp.options[subType.toLowerCase()] = true
    }
    if (type.startsWith('CON_')) {
      temp.type = 'CONNECTOR';
      const category = type.split('_')[1];
      temp.options['category'] = category
    }

    if (type == 'FOREACH' || type == 'REDUCE') {
      temp.options.startNode = null;
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
      temp.options.code = tempCode.join('\n');
    }
    return temp;
  }

  getNodesBefore(currNode: any) {
    let temp = [];
    let nodeId = '';
    if (typeof currNode == 'string') {
      nodeId = currNode;
    }
    else {
      nodeId = currNode._id;
    }
    let prevNode = this.nodeList.find(e => {
      let nexItems = _.concat((e.onSuccess || []), (e.onError || []));
      if (nexItems.find((es) => es._id == nodeId)) {
        return true;
      }
      return false;
    });
    if (prevNode) {
      temp.push(prevNode);
      temp = temp.concat(this.getNodesBefore(prevNode));
    }
    return temp;
  }

  generateLinkPath(origX: number, origY: number, destX: number, destY: number, sc: number) {
    return this.pathService.getElbowPath(origX, origY, destX, destY, sc);
  }

  cleanPayload(nodeList: Array<any>) {
    nodeList.forEach((node: any) => {
      if (node.onSuccess && node.onSuccess.length > 0) {
        let indexesToRemove = [];
        node.onSuccess.forEach((nextNode: any, index: number) => {
          if (nodeList.findIndex(e => e._id == nextNode._id) == -1) {
            indexesToRemove.push(index);
          }
          if (nextNode._id == node._id) {
            indexesToRemove.push(index);
          }
        });
        if (indexesToRemove.length > 0) {
          indexesToRemove.reverse();
          indexesToRemove.forEach((index: number) => {
            node.onSuccess.splice(index, 1);
          });
        }
      }
    });
  }

  jsonFromStructure(schema: any) {
    if (schema && schema.definition) {
      return this.convertDefinitionToJSON(schema.definition);
    }
    return {};
  }

  convertDefinitionToJSON(definition: Array<any>) {
    let temp = {};
    if (definition) {
      definition.forEach(item => {
        if (item.type == 'Array') {
          let arrayType = item.definition[0].type;
          temp[item.key] = [];
          if (arrayType == 'Object') {
            temp[item.key].push(this.convertDefinitionToJSON(item.definition[0].definition));
          } else {
            if (arrayType == 'Number') {
              temp[item.key].push(2023);
            } else if (arrayType == 'Boolean') {
              temp[item.key].push(true);
            } else if (arrayType == 'Date') {
              temp[item.key].push(new Date().toISOString());
            } else {
              temp[item.key].push('');
            }
          }
        } else if (item.type == 'Object') {
          temp[item.key] = this.convertDefinitionToJSON(item.definition);
        } else if (item.type == 'Number') {
          temp[item.key] = 2023;
        } else if (item.type == 'Boolean') {
          temp[item.key] = true;
        } else if (item.type == 'Date') {
          temp[item.key] = new Date().toISOString();
        } else {
          temp[item.key] = '';
        }
      });
    }
    return temp;
  }

  getNestedSuggestions(node: any, definition: Array<any>, parentKey?: any) {
    let list = [];
    if (definition && definition.length > 0) {
      definition.forEach((def: any) => {
        // let key = parentKey ? parentKey + '.' + def.key : def.key;
        let key = def.properties.dataPathSegs.join('.');
        if (def.type == 'Object') {
          list = list.concat(this.getNestedSuggestions(node, def.definition, key));
        } else {
          let item: any = {};
          item.label = (node._id || node.type) + '/body/' + key;
          item.value = node._id + '.body.' + key;
          list.push(item);
          if (node.type == "DATASERVICE") {
            item = {};
            item.label = (node._id || node.type) + '/responseBody[0]/' + key;
            item.value = node._id + '.responseBody[0].' + key;
            list.push(item);
          } else {
            item = {};
            item.label = (node._id || node.type) + '/responseBody/' + key;
            item.value = node._id + '.responseBody.' + key;
            list.push(item);
          }
        }
      });
    }
    return list;

  }

  getSuggestions(currNode?): Array<{ label: string, value: string }> {
    if (!this.nodeList || this.nodeList.length == 0) {
      return [];
    }

    const availableHeaderKeys = ['authorization', 'content-type', 'token', 'ip', 'custom'];
    const list = currNode ? this.getNodesBefore(currNode) : this.nodeList;
    const temp = list.map(node => {
      let list = [];
      let statusCode: any = {};
      statusCode.label = (node._id || node.type) + '/statusCode'
      statusCode.value = node._id + '.statusCode'
      list.push(statusCode);
      let status: any = {};
      status.label = (node._id || node.type) + '/status'
      status.value = node._id + '.status'
      list.push(status);
      availableHeaderKeys.forEach(key => {
        let headers: any = {};
        headers.label = (node._id || node.type) + '/headers/' + key;
        headers.value = node._id + '.headers.' + key;
        list.push(headers);
      })
      // headers.label = (node._id || node.type) + '/headers'
      // headers.value = node._id + '.headers'
      // list.push(headers);
      if (!node.dataStructure) {
        node.dataStructure = {};
      }
      if (!node.dataStructure.outgoing) {
        node.dataStructure.outgoing = {};
      }
      if (node.dataStructure.outgoing.definition) {
        list = list.concat(this.getNestedSuggestions(node, node.dataStructure.outgoing.definition));
        // node.dataStructure.outgoing.definition.forEach(def => {
        //   let item: any = {};
        //   item.label = (node._id || node.type) + '/body/' + def.key;
        //   item.value =node._id + '.body.' + def.key;
        //   list.push(item);
        //   item = {};
        //   item.label = (node._id || node.type) + '/responseBody/' + def.key;
        //   item.value =node._id + '.responseBody.' + def.key;
        //   list.push(item);
        // });
      }
      else {
        let item: any = {};
        item.label = (node._id || node.type) + '/body';
        item.value = node._id + '.body';
        list.push(item);
        item = {};
        item.label = (node._id || node.type) + '/responseBody';
        item.value = node._id + '.responseBody';
        list.push(item);
      }
      return list;
    })
    return _.flatten(temp);
  }

  getNodeOptions() {
    return [{
      name: 'File',
      children: [
        {
          name: 'File Agent',
          action: 'FILE',
          icon: 'dsi dsi-file'
        }
      ],
      icon: 'dsi dsi-file'
    },
    {
      name: 'API',
      children: [
        {
          name: 'Invoke JSON API',
          action: 'API',
          icon: 'dsi dsi-invoke-api'
        },
        {
          name: 'Invoke Multipart API',
          action: 'API_FILE',
          icon: 'dsi dsi-invoke-api'
        },
        {
          name: 'Response',
          action: 'RESPONSE',
          icon: 'dsi dsi-response'
        }
      ],
      icon: 'dsi dsi-invoke-api'
    },
    {
      name: 'SFTP',
      children: [
        {
          action: 'SFTP_READ',
          name: 'SFTP Read',
          icon: 'dsi dsi-function'
        },
        {
          action: 'SFTP_WRITE',
          name: 'SFTP Write',
          icon: 'dsi dsi-function'
        },
        {
          action: 'SFTP_MOVE',
          name: 'SFTP Move',
          icon: 'dsi dsi-function'
        },
        {
          action: 'SFTP_LIST',
          name: 'SFTP List',
          icon: 'dsi dsi-function'
        },
      ],
      icon: 'dsi dsi-function'
    },
    {
      name: 'Process',
      children: [
        {
          name: 'Connector',
          icon: 'dsi dsi-connector',
          children: [
            {
              action: 'CON_DB',
              name: 'DB Connector',
              icon: 'dsi dsi-connector'
            },
            {
              action: 'CON_FILE',
              name: 'SFTP Connector',
              icon: 'dsi dsi-connector'
            },
            {
              action: 'CON_STORAGE',
              name: 'Storage Connector',
              icon: 'dsi dsi-connector'
            }
          ]
        },
        {
          name: 'Data Service',
          icon: 'dsi dsi-data-service alt',
          children: [
            {
              action: 'DS_GET',
              name: 'Data Service Fetch',
              icon: 'dsi dsi-data-service alt'
            },
            {
              action: 'DS_INSERT',
              name: 'Data Service Insert',
              icon: 'dsi dsi-data-service alt'
            },
            {
              action: 'DS_UPDATE',
              name: 'Data Service Update',
              icon: 'dsi dsi-data-service alt'
            },
            {
              action: 'DS_DELETE',
              name: 'Data Service Delete',
              icon: 'dsi dsi-data-service alt'
            },
            {
              action: 'DATASERVICE_APPROVE',
              name: 'Workflow Approve',
              icon: 'dsi dsi-data-service alt',
            },
            {
              action: 'DATASERVICE_REJECT',
              name: 'Workflow Reject',
              icon: 'dsi dsi-data-service alt',
            },
          ]
        },
        {
          name: 'Function',
          action: 'FUNCTION',
          icon: 'dsi dsi-function'
        },
        {
          name: 'Flow',
          action: 'FLOW',
          icon: 'dsi dsi-flow'
        },
      ],
      icon: 'dsi dsi-function alt'
    },
    {
      name: 'Transform',
      children: [
        {
          name: 'Mapping',
          action: 'MAPPING',
          icon: 'dsi dsi-mapping'
        },
        {
          name: 'Converter',
          action: 'CONVERT_JSON_JSON',
          icon: 'dsi dsi dsi-refresh text-secondary'
        },
        {
          name: 'De-Dupe',
          action: 'DEDUPE',
          icon: 'dsi dsi dsi-copy'
        },
        {
          name: 'Code Block',
          action: 'CODEBLOCK',
          icon: 'dsi dsi dsi-console text-secondary'
        },
        {
          name: 'Change Root',
          action: 'UNWIND',
          icon: 'dsi dsi-expand'
        }
      ],
      icon: 'dsi dsi-join'
    },
    {
      name: 'Condition',
      icon: ' dsi dsi-branch ',
      action: 'CONDITION'
    },
    {
      name: 'Plugin',
      icon: ' dsi dsi-api-doc text-info ',
      action: 'PLUGIN'
    },
    {
      name: 'Global Error',
      condition: '!this.hasErrorNode',
      action: 'ERROR',
      icon: 'dsi dsi-danger-circle text-danger'
    }]
  }


  getErrorValidations() {
    const obj = [
      {
        node: 'API',
        validations: [
          {
            type: 'required',
            fieldPath: 'options.contentType',
            error: 'Content Type is required'
          },
          {
            type: 'required',
            fieldPath: 'options.method',
            error: 'HTTP Method is required'
          }
        ]
      },
      {
        node: 'FILE',
        validations: [
          {
            type: 'required',
            condition: {
              inputNode: true
            },
            fieldPath: 'options.inputDirectories',
            error: 'Input Directory is required'
          },
          {
            type: 'required',
            condition: {
              inputNode: false
            },
            fieldPath: 'options.outputDirectories',
            error: 'Output Directory is required'
          },
          {
            type: 'required',
            fieldPath: 'options.method',
            error: 'HTTP Method is required'
          }
        ]
      },
      {
        node: 'MAPPING',
        validations: [
          {
            type: 'required',
            fieldPath: 'mappings',
            error: 'Mapping is required'
          }
        ]
      },
      {
        node: 'CONVERT_JSON_JSON',
        validations: [
          {
            type: 'required',
            fieldPath: 'mappings',
            error: 'Conversion is required'
          }
        ]
      },
      {
        node: 'CONNECTOR',
        validations: [
          {
            subType: 'DB',
            type: 'required',
            fieldPath: 'options.query',
            error: 'Query is required'
          }
        ]
      },
      {
        node: 'DATASERVICE',
        validations: [
          {
            type: 'required',
            fieldPath: 'options.authorization',
            error: 'Authorization is required'
          },
          {
            type: 'required',
            fieldPath: 'options.dataService',
            error: 'Data Service is required'
          },
          {
            subType: 'DELETE',
            type: 'required',
            fieldPath: 'options.documentId',
            error: 'ID is required'
          }
        ]
      },
      {
        node: 'DATASERVICE_APPROVE',
        validations: [
          {
            type: 'required',
            fieldPath: 'options.filter',
            error: 'Filter is required'
          }
        ]
      },
      {
        node: 'DATASERVICE_REJECT',
        validations: [
          {
            type: 'required',
            fieldPath: 'options.filter',
            error: 'Filter is required'
          }
        ]
      },
    ]

    return obj
  }
}
