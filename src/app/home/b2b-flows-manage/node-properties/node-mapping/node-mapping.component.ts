import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
import * as _ from 'lodash';
import Fuse from 'fuse.js';

import { AppService } from 'src/app/utils/services/app.service';
import { environment } from 'src/environments/environment';
import { B2bFlowService } from '../../b2b-flow.service';
import { MappingService } from './mapping.service';
import { CommonService } from '../../../../utils/services/common.service';

@Component({
  selector: 'odp-node-mapping',
  templateUrl: './node-mapping.component.html',
  styleUrls: ['./node-mapping.component.scss'],
  providers: [MappingService]
})
export class NodeMappingComponent implements OnInit {

  @ViewChild('arrayOptions') arrayOptions: TemplateRef<HTMLElement>;
  @Input() edit: any;
  @Input() flowData: any;
  @Input() currNode: any;
  @Input() inputNode: any;
  @Input() source: string;
  @Output() close: EventEmitter<any>;
  allSources: Array<any>;
  allTargets: Array<any>;
  allConstants: Array<any>;
  tempMappings: Array<any>;
  pathList: Array<any>;
  nodeList: Array<any>;
  selectedPath: any;
  dragItem: any;
  targetExpandCollapseObjects: any;
  sourceExpandCollapseObjects: any;
  currentOpenEditor: any;
  constructor(private appService: AppService,
    private mappingService: MappingService,
    private flowService: B2bFlowService,
    private commonService: CommonService) {
    this.nodeList = [];
    this.close = new EventEmitter();
    this.edit = {
      status: false
    };
    this.allSources = [];
    this.allTargets = [];
    this.allConstants = [];
    this.pathList = [];
    this.source = 'outgoing';
    this.targetExpandCollapseObjects = {};
    this.sourceExpandCollapseObjects = {};
  }

  ngOnInit(): void {
    if (!this.mappingType) {
      this.mappingType = 'custom';
    }
    if (!this.flowData.constants) {
      this.flowData.constants = [];
    }
    this.nodeList = this.flowService.getNodesBefore(this.currNode);
    this.configureMappingData();
    this.setMapping();

    this.mappingService.reCreatePaths.pipe(debounceTime(200)).subscribe((data: any) => {
      if (data) {
        this.renderPaths(data.source.definition, data.target.definition);
      } else {
        this.pathList = [];
        this.allTargets.forEach((target: any) => {
          (target.source || []).forEach((src) => {
            this.renderPaths(src, target);
          });
        });
      }
    });
    this.mappingService.clearMappings.subscribe(() => {
      this.allTargets.forEach((target: any) => {
        if (target.source && target.source.length > 0) {
          target.source.splice(0);
          this.markAttributesDisabled(target);
        }
      });
    });
  }

  setMapping(){
    if (this.currNode.mappings && this.currNode.mappings.length > 0) {
      this.tempMappings = this.appService.cloneObject(this.currNode.mappings);
      this.allTargets.forEach((item: any) => {
        let temp = this.tempMappings.find((e: any) => e.target.dataPath == item.dataPath);
        if (temp && temp.source && temp.source.length > 0) {
          item.source = (temp.source || []).map((source: any) => {
            let t = this.allSources.find((src: any) => src._id == source._id);
            if (!t) {
              t = this.allConstants.find((src: any) => src._id == source._id);
            }
            return t;
          }).filter(e => e);
        }
        if (temp && temp.formula) {
          item.formula = temp.formula;
        }
        if (temp && temp.formulaConfig) {
          item.formulaConfig = temp.formulaConfig;
        }
      });
      setTimeout(() => {
        this.mappingService.reCreatePaths.emit(null);
      }, 200);
    }
  }

  configureMappingData() {
    this.pathList = [];
    this.allSources = [];
    let temp = [];
    if (this.currNode.dataStructure && this.currNode.dataStructure[this.source] && this.currNode.dataStructure[this.source].definition) {
      temp = this.appService.cloneObject(this.currNode.dataStructure[this.source].definition) || [];
    }
    let isDataFormat = this.currNode.dataStructure?.[this.source]?._id.startsWith('SRVC') ? false : true;
    this.allTargets = this.mappingService.flatten((this.currNode.dataStructure?.[this.source]?.formatType || 'JSON'), temp, isDataFormat);
    this.allTargets.forEach(item => {
      if (item.type == 'Object') {
        this.targetExpandCollapseObjects[item.dataPath] = false;
      }
    });
    let tempConstants = this.appService.cloneObject(this.flowData.constants);
    tempConstants.map((item) => {
      delete item._id;
      if (item.key == 'true') {
        item.key = '_self';
      }
      item.type = item.dataType;
      item._id = `CONSTANTS.${item.key}`;
      item.dataPath = 'CONSTANTS.' + item.key;
      item.dataPathSegs = ['CONSTANTS', item.key];
      item.name = item.key;
      item.isConstant = true;
      item.properties = {
        dataPath: item.dataPath,
        dataPathSegs: item.dataPathSegs,
        name: item.key
      };
      item.depth = 0;
      this.allConstants.push(item);
    });
    this.flowData.errorNode && this.dealWithErroNode(this.nodeList);
    this.nodeList.forEach((node: any) => {
      let outgoing;
      if (node.dataStructure?.outgoing && node.dataStructure?.outgoing?.definition) {
        node.definition = node.dataStructure.outgoing.definition;
      }
      if (node._id != this.currNode._id) {
        if (node.dataStructure?.outgoing && node.dataStructure?.outgoing?.definition) {
          outgoing = this.appService.cloneObject(node.dataStructure.outgoing.definition);
          let isDataFormat = node.dataStructure.outgoing._id.startsWith('SRVC') ? false : true;
          this.allSources = this.allSources.concat(this.flattenSource(node, outgoing, 'responseBody', isDataFormat, false));
        }
      }
    });
  }

  dealWithErroNode(completeList: Array<any>) {
    if (this.flowData.errorNode?.dataStructure?.outgoing?.definition) {
      completeList.push(this.flowData.errorNode)
    }
    else if (this.flowData.errorNode?.dataStructure?.outgoing?._id) {
      const id = this.flowData.errorNode.dataStructure.outgoing._id || '';
      this.flowData.errorNode.dataStructure['outgoing'] = this.flowData.dataStructures[id]
      completeList.push(this.flowData.errorNode)
    }
  }

  cancel() {
    this.close.emit(false);
  }


  done() {
    let mappings = this.allTargets.map(item => this.convertToMapping(item));
    this.currNode.mappings = mappings;
    this.cancel();
    if (!environment.production) {
      console.log(mappings);
    }
  }

  convertToMapping(item: any) {
    const temp: any = {};
    temp.target = {
      _id: item._id,
      type: item.type,
      dataPath: item.dataPath,
      dataPathSegs: item.dataPathSegs
    };
    temp.source = (item.source || []).map((s) => {
      let temp: any = {};
      temp.nodeId = s.nodeId;
      temp._id = s._id;
      temp.type = s.type;
      temp.dataPath = s.dataPath;
      temp.dataPathSegs = s.dataPathSegs;
      return temp;
    });
    temp.formula = item.formula;
    temp.formulaConfig = item.formulaConfig;
    temp.advanceFormula = item.advanceFormula;
    return temp;
  }

  doFuzzyMapping() {
    // this.mappingService.fuzzyMapping.emit(true);
    const options = {
      includeScore: true,
      isCaseSensitive: false,
      useExtendedSearch: true,
      minMatchCharLength: 4,
      keys: ['dataPath']
    };
    this.allTargets.filter(e => e.type != 'Object').forEach((def: any) => {
      let temp = this.allSources.find(e => (e.dataPath == def.dataPath) || (_.toLower(_.camelCase(e.dataPath)) == _.toLower(_.camelCase(def.dataPath))));
      if (!def.source) {
        def.source = [];
      }
      if (temp && def.type != 'Array' && temp.dataPath?.indexOf('[#]') == -1 && def.source.length == 0) {
        def.source.push(temp);
      }
    });
    this.allTargets.filter(e => e.type != 'Object').forEach((def: any) => {
      if (def.type !== 'Array' && def.dataPath?.indexOf('[#]') == -1) {
        const fuse = new Fuse(this.allSources.filter(e => e.type != 'Object'), options);
        let result = fuse.search(def.dataPath).filter(e => e.score < 0.3);
        if (!def.source) {
          def.source = [];
        }
        if (def.source.length == 0) {
          result = result.sort((a, b) => a.score - b.score);
          if (result.length > 0) {
            def.source.push(result[0].item);
            // this.mappingService.reCreatePaths.emit();
          }
        }
      }
    });
    setTimeout(() => {
      this.mappingService.reCreatePaths.emit();
    }, 200);
  }

  doClearMapping() {
    this.mappingService.clearMappings.emit(true);
    setTimeout(() => {
      this.mappingService.reCreatePaths.emit();
    }, 200);
  }

  renderPaths(source: any, target: any) {
    // const sourceId = source._id;
    // const targetId = target._id;
    const sourceIdSegs = source._id.split('.');
    const targetIdSegs = target._id.split('.');
    let sourceId = sourceIdSegs.join('.');
    let targetId = targetIdSegs.join('.');
    const sourceNodeId = source.nodeId;
    const mappingPaths: HTMLElement = document.querySelectorAll('.mapping-paths')[0] as HTMLElement;
    let sourceEle: HTMLElement = document.querySelectorAll(`.source-list [data-id='${sourceId}']`)[0] as HTMLElement;
    let targetEle: HTMLElement = document.querySelectorAll(`.target-list [data-id='${targetId}']`)[0] as HTMLElement;
    while (targetId && !targetEle) {
      targetIdSegs.pop();
      targetId = targetIdSegs.join('.');
      if (targetId.endsWith('[#]')) {
        targetId = targetId.replace('[#]', '');
      }
      targetEle = document.querySelectorAll(`.target-list [data-id='${targetId}']`)[0] as HTMLElement;
    }

    while (sourceId && !sourceEle) {
      sourceIdSegs.pop();
      sourceId = sourceIdSegs.join('.');
      if (sourceId.endsWith('[#]')) {
        sourceId = sourceId.replace('[#]', '');
      }
      sourceEle = document.querySelectorAll(`.source-list [data-id='${sourceId}']`)[0] as HTMLElement;
    }

    const nodeEle: HTMLElement = document.querySelectorAll(`.source-list [data-id='${sourceNodeId}']`)[0] as HTMLElement;
    const pathRect = mappingPaths.getBoundingClientRect();
    const targetRect = targetEle.getBoundingClientRect();
    let tempRect;
    if (sourceEle && targetEle) {
      tempRect = sourceEle.getBoundingClientRect();
    } else if (nodeEle && targetEle) {
      tempRect = nodeEle.getBoundingClientRect();
    }
    if (tempRect) {
      const sourceCoordinates = {
        x: 0,
        y: tempRect.top - pathRect.top + 10
      };
      const targetCoordinates = {
        x: pathRect.width,
        y: targetRect.top - pathRect.top + 10
      };
      let path = `M ${sourceCoordinates.x} ${sourceCoordinates.y} L ${targetCoordinates.x} ${targetCoordinates.y};`
      this.pathList.push({ path, source: source._id, target: target._id });
    }
  }

  flattenSource(node: any, definition: Array<any>, bodyKey: string, isDataFormat: boolean, isSource: boolean, parentDef?: any) {
    let list = [];
    try {
      if (definition && definition.length > 0) {
        definition.forEach((def, i) => {
          delete def._id;
          if (def.key == 'true') {
            def.key = '_self';
          }
          def.nodeId = node._id;
          def.name = def.properties.name
          def.depth = parentDef ? parentDef.depth + 1 : 0;
          if (def.properties.password) {
            def.type = 'String';
            def._id = `${node._id}.${bodyKey}.${def.properties.dataPath}`;
            def.dataPath = def.properties.dataPath + '.value';
            def.dataPathSegs = [].concat(def.properties.dataPathSegs, ['value']);
          } else if (def.type == 'Date' || def.properties.dateType) {
            def._id = `${node._id}.${bodyKey}.${def.properties.dataPath}`;
            if (isDataFormat) {
              def.dataPath = def.properties.dataPath;
              def.dataPathSegs = def.properties.dataPathSegs;
            } else {
              if (isSource) {
                def.dataPath = def.properties.dataPath + '.utc';
                def.dataPathSegs = [].concat(def.properties.dataPathSegs, ['utc']);
              } else {
                def.dataPath = def.properties.dataPath + '.rawData';
                def.dataPathSegs = [].concat(def.properties.dataPathSegs, ['rawData']);
              }
            }
          } else {
            def._id = `${node._id}.${bodyKey}.${def.properties.dataPath}`;
            def.dataPath = def.properties.dataPath;
            def.dataPathSegs = def.properties.dataPathSegs;
          }
          list.push(def);
          if (def.type == 'Array') {
            if (def.definition[0].type == 'Object') {
              list = list.concat(this.flattenSource(node, def.definition[0].definition, bodyKey, isDataFormat, isSource, def));
            }
          } else if (def.type == 'Object') {
            if (def.properties.relatedTo) {
              def.type == 'String';
              def.dataPath = def.dataPath + '._id';
              def.dataPathSegs = [].concat(def.dataPathSegs, ['_id']);
              // const idDef = def.definition.filter(d => d.key === '_id')[0];
              // idDef.properties['dataPath'] = def.dataPath + '._id';
              // idDef.properties['dataPathSegs'] = [def.dataPath, '_id'];
              // list = list.concat(this.flattenSource(node, [idDef], bodyKey, def))
            } else {
              list = list.concat(this.flattenSource(node, def.definition, bodyKey, isDataFormat, isSource, def));
            }
          }
        });
      };
    } catch (err) {
      console.log(err);
    }
    return list;
  }

  selectPath(event: any, path: any, index: number) {
    event.stopPropagation();
    this.selectedPath = path;
  }

  isPathSelected(path: any) {
    if (this.selectedPath && this.selectedPath.source == path.source && this.selectedPath.target == path.target) {
      return true;
    }
    return false;
  }

  getDeleteIconStyle(path: any) {
    const segs = path.path.split(" ");
    let x = segs[8] - 100;
    let y = segs[9];
    return { transform: `translate(${x}px,${y}px)` };
  }

  deletePath(event: any, path: any, index: number) {
    event.stopPropagation();
    this.pathList.splice(index, 1);
    const temp = this.allTargets.find(e => e._id == path.target);
    if (temp && temp.source && temp.source.length > 0) {
      let tempIndex = temp.source.findIndex(e => e._id == path.source);
      temp.source.splice(tempIndex, 1);
    }
  }

  getDataTypeStyleClass(type: string) {
    switch (type) {
      case 'String':
        return 'text-success';
      case 'Number':
        return 'text-warning';
      case 'Boolean':
        return 'text-info';
      case 'Object':
        return 'text-grey';
      case 'Array':
        return 'text-grey';
      default:
        return 'text-primary';
    }
  }

  onDragStart(event: DragEvent, def: any) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text', def.dataPath);
    this.dragItem = def;
  }

  onDragEnter(event: DragEvent, def: any) {
    if (!def.disabled) {
      def.over = true;
    }
  }

  onDragOver(event: DragEvent, def: any) {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent, def: any) {
    def.over = false;
  }

  onDrop(event: DragEvent, def: any) {
    def.over = false;
    event.dataTransfer.dropEffect = 'copy';
    if (!this.dragItem) {
      return;
    }
    if (def.disabled) {
      return;
    }

    if (def.type == 'Array') {
      let allTargets = this.allTargets.filter(e => e.dataPath?.startsWith(def.dataPath) && e.dataPath != def.dataPath);
      if (allTargets && allTargets.length > 0) {
        allTargets.forEach(e => {
          e.hide = true;
        });
      }
    } else if (def.dataPath?.indexOf('[#]') > -1) {
      let path = def.dataPath?.split('[#].')[0] || '';
      let temp = this.allTargets.find(e => e.dataPath == path);
      if (temp) {
        temp.disabled = true;
      }
    }
    if (!def.source) {
      def.source = [];
    }
    if (def.source.find(ele => ele.dataPath === this.dragItem.dataPath && ele.nodeId === this.dragItem.nodeId)) {
      return;
    }
    if (this.dragItem) {
      def.source.push(this.dragItem);
      this.mappingService.reCreatePaths.emit();
    }
    this.dragItem = null;
  }

  isMapped(def: any) {
    if (def.source && def.source.length > 0) {
      return true;
    }
    return false;
  }

  isSourceMapped(def: any) {
    let flag = false;
    flag = this.allTargets.find(ele => {
      return (ele.source || []).find(src => {
        return src._id == def._id;
      });
    });
    return flag;
  }

  isValidFunction(def: any) {
    if (def.source && def.source.length > 1 && !def.formula && !def.formulaConfig && !def.advanceFormula) {
      return false;
    }
    return true;
  }

  removeSource(def: any, source: any) {
    let index = def.source.findIndex(src => src._id == source._id);
    if (index > -1) {
      def.source.splice(index, 1);
      this.mappingService.reCreatePaths.emit();
      this.markAttributesDisabled(def);
    }
  }

  markAttributesDisabled(def: any) {
    this.allTargets.forEach(item => {
      if (item.dataPath?.startsWith(def.dataPath)) {
        item.hide = false;
      }
      let targetPath = def?.dataPath?.split('[#]')[0] || '';
      let matchingTarget = this.allTargets.find(e => e.dataPath == targetPath);
      if (matchingTarget) {
        if (matchingTarget.definition && matchingTarget.definition[0] && matchingTarget.definition[0].definition && matchingTarget.definition[0].definition.every(e => !e.source || e.source.length == 0)) {
          matchingTarget.disabled = false;
        }
      }
    });
  }

  showToggleBtn(def: any) {
    if (def.type == 'Object') {
      return true;
    }
    if (def.type == 'Array' && def.definition[0].type == 'Object') {
      return true;
    }
    return false;
  }

  toggleTarget(def: any) {
    this.targetExpandCollapseObjects[def.dataPath] = !this.targetExpandCollapseObjects[def.dataPath];
    this.mappingService.reCreatePaths.emit();
  }

  isTargetItemCollapsed(def: any) {
    let flag = false;
    if (def.type == 'Object' || def.type == 'Array') {
      return false;
    }
    let key = def?.dataPath?.split('[#].')[0] || '';
    flag = this.targetExpandCollapseObjects[key];
    if (!flag) {
      let segments = def?.dataPath?.split('.') || [];
      let temp = JSON.parse(JSON.stringify(segments));
      segments.forEach((key) => {
        temp.pop();
        let p = temp.join('.');
        if (!flag) {
          flag = this.targetExpandCollapseObjects[p];
        }
      });
    }
    return flag;
  }


  toggleSource(def: any) {
    this.sourceExpandCollapseObjects[def._id] = !this.sourceExpandCollapseObjects[def._id];
    this.mappingService.reCreatePaths.emit();
  }

  isSourceItemCollapsed(def: any) {
    let flag = false;
    if (def.type == 'Object' || def.type == 'Array') {
      return false;
    }
    let key = def._id.split('[#].')[0];
    flag = this.sourceExpandCollapseObjects[key];
    if (!flag) {
      let segments = def._id.split('.');
      let temp = JSON.parse(JSON.stringify(segments));
      segments.forEach((key) => {
        temp.pop();
        let p = temp.join('.');
        if (!flag) {
          flag = this.sourceExpandCollapseObjects[p];
        }
      });
    }
    return flag;
  }

  checkForDataMapping() {
    if (this.currNode.type === 'FILE' || (this.currNode.type === 'CONNECTOR' && ['STORAGE', 'FILE'].includes(this.currNode.options.category))) {
      this.mappingType = 'preset';
      return false;
    }
    return true;
  }

  getNodeDataType(node: any) {
    if (node.dataStructure && node.dataStructure?.outgoing && node.dataStructure?.outgoing?._id) {
      if (node.dataStructure.outgoing._id.startsWith('SRVC')) {
        return 'Array';
      } else {
        return node.dataStructure?.outgoing?.type || 'Object';
      }
    }
    return 'Object';
  }

  get mappingType() {
    return this.currNode.mappingType;
  }

  set mappingType(val: string) {
    this.currNode.mappingType = val;
  }

  toggleFormulaEditor(def: any): void {
    if (def._showFn) {
        def._showFn = false;
    } else {
        this.closeCurrentFormulaEditor();
        def._showFn = true;
        this.currentOpenEditor = def;
    }
  }

  closeCurrentFormulaEditor(): void {
      if (this.currentOpenEditor) {
          this.currentOpenEditor._showFn = false;
      }
      this.currentOpenEditor = null;
  }
}
