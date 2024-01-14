import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import { CommonService } from 'src/app/utils/services/common.service';
import { environment } from 'src/environments/environment';
import { B2bFlowService } from '../b2b-flow.service';

@Component({
  selector: 'odp-path-properties',
  templateUrl: './path-properties.component.html',
  styleUrls: ['./path-properties.component.scss']
})
export class PathPropertiesComponent implements OnInit {

  @Input() edit: any;
  @Input() path: any;
  @Input() flowData: any;
  @Input() nodeList: Array<any>;
  @Output() close: EventEmitter<any>;
  @Output() changesDone: EventEmitter<any>;
  nodeIndex: number
  pathType: string;
  toggle: any;
  insertText: EventEmitter<string>;
  constructor(private commonService: CommonService,
    private appService: AppService,
    private flowService: B2bFlowService) {
    this.edit = { status: false };
    this.close = new EventEmitter();
    this.changesDone = new EventEmitter();
    this.nodeList = [];
    this.toggle = {};
    this.insertText = new EventEmitter();
  }

  ngOnInit(): void {
    // this.nodeIndex = this.nodeList.findIndex(e => (e.onSuccess || []).find((es, ei) => es._id == this.path.path._id && ei == this.path.index));
    this.nodeIndex = this.nodeList.findIndex(e => e._id == this.path.path.prevNode);
   if(this.path?.path.type){
      this.pathType = this.path.path.type;
   }
   else{
    const successIndex = (this.nodeList[this.nodeIndex].onSuccess || []).findIndex(e => e._id == this.path.path._id);
    const errorIndex = (this.nodeList[this.nodeIndex].onError || []).findIndex(e => e._id == this.path.path._id);
    if (successIndex > -1) {
      this.pathType = 'success';
    } else if (errorIndex > -1) {
      this.pathType = 'error';
    }
   }
    if (!environment.production) {
      console.log(this.path);
    }
  }

  deletePath() {
    let onSuccess = true;
    let findIndex = (this.nodeList[this.nodeIndex].onSuccess || []).findIndex(e => e._id == this.path.path._id);
    if (findIndex == -1) {
      onSuccess = false;
      findIndex = (this.nodeList[this.nodeIndex].onError || []).findIndex(e => e._id == this.path.path._id);
    }
    if (findIndex > -1) {
      if (onSuccess) {
        (this.nodeList[this.nodeIndex].onSuccess || []).splice(findIndex, 1);
      } else {
        (this.nodeList[this.nodeIndex].onError || []).splice(findIndex, 1);
      }
    } else {
      findIndex = (this.nodeList[this.nodeIndex].conditions || []).findIndex(e => e._id == this.path.path._id);
      if (findIndex > -1) {
        (this.nodeList[this.nodeIndex].conditions || [])[findIndex]._id = null;
      }
    }
    this.cancel();
    this.flowService.selectedPath.emit(null);
    this.flowService.reCreatePaths.emit(null);
  }

  onChange(event, type?) {
    this.toggle['colorPicker'] = false;
    this.flowService.reCreatePaths.emit(null);
  }

  cancel() {
    this.close.emit(false);
  }

  nameChange(event){
    // console.log(this.path);
  }
  colorChange(event){
    // console.log(this.path);
  }

  onPathTypeChange(event: any, type: string) {
    this.pathType = type;
    if (event) {
      if (!this.nodeList[this.nodeIndex].onError) {
        this.nodeList[this.nodeIndex].onError = [];
      }
      if (!this.nodeList[this.nodeIndex].onSuccess) {
        this.nodeList[this.nodeIndex].onSuccess = [];
      }
      const successIndex = (this.nodeList[this.nodeIndex].onSuccess || []).findIndex(e => e._id == this.path.path._id);
      const errorIndex = (this.nodeList[this.nodeIndex].onError || []).findIndex(e => e._id == this.path.path._id);
      let pathData;
      if (successIndex > -1) {
        pathData = (this.nodeList[this.nodeIndex].onSuccess || [])[successIndex];
        (this.nodeList[this.nodeIndex].onSuccess || []).splice(successIndex, 1);
      }
      if (errorIndex > -1) {
        pathData = (this.nodeList[this.nodeIndex].onError || [])[errorIndex];
        (this.nodeList[this.nodeIndex].onError || []).splice(errorIndex, 1);
      }
      if (type === 'error') {
        this.nodeList[this.nodeIndex].onError.push(pathData);
        this.color = "F44336";
      } else {
        this.nodeList[this.nodeIndex].onSuccess.push(pathData);
        this.color = "666";
      }
      this.onChange(event);
    }
  }

  onVariableSelect(data: any) {
    this.toggle['variable'] = false;
    this.insertText.emit(data);
  }

  get condition() {
    if (this.pathType == 'error') {
      if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onError && this.nodeList[this.nodeIndex].onError[this.path.index]) {
        return this.nodeList[this.nodeIndex].onError[this.path.index].condition;
      }
    } else {
      if(this.path?.path?.condition != null || this.path?.path?.condition != undefined){
        return this.path.path.condition;
      }
      if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onSuccess && this.nodeList[this.nodeIndex].onSuccess[this.path.index]) {
        return this.nodeList[this.nodeIndex].onSuccess[this.path.index].condition;
      }
    }
  }

  set condition(condition: string) {
    if (this.pathType == 'error') {
      if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onError && this.nodeList[this.nodeIndex].onError[this.path.index]) {
        this.nodeList[this.nodeIndex].onError[this.path.index].condition = condition;
      }
    } else {
      if(this.path?.path && this.nodeList[this.nodeIndex]?.onSuccess){
        this.nodeList[this.nodeIndex].onSuccess.find(node => node._id === this.path.path._id).condition = condition;
      }
      else if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onSuccess && this.nodeList[this.nodeIndex].onSuccess[this.path.index]) {
        this.nodeList[this.nodeIndex].onSuccess[this.path.index].condition = condition;
      }
    }
  }

  get name() {
    if (this.pathType == 'error') {
      if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onError && this.nodeList[this.nodeIndex].onError[this.path.index]) {
        return this.nodeList[this.nodeIndex].onError[this.path.index].name;
      }
    } else {
      if(this.path?.path?.name != null || this.path?.path?.name != undefined){
        return this.path.path.name;
      }
      if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onSuccess && this.nodeList[this.nodeIndex].onSuccess[this.path.index]) {
        return this.nodeList[this.nodeIndex].onSuccess[this.path.index].name;
      }
    }
  }

  set name(name: string) {
    if (this.pathType == 'error') {
      if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onError && this.nodeList[this.nodeIndex].onError[this.path.index]) {
        this.nodeList[this.nodeIndex].onSuccess.find(node => node._id === this.path.path._id).name = name;

      }
    } else {
      if(this.path?.path && this.nodeList[this.nodeIndex]?.onSuccess){
        this.path.path.name = name ;
      }
     else if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onSuccess && this.nodeList[this.nodeIndex].onSuccess[this.path.index]) {
        this.nodeList[this.nodeIndex].onSuccess[this.path.index].name = name;
      }
    }
  }

  get color() {
    if (this.pathType == 'error') {
      if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onError && this.nodeList[this.nodeIndex].onError[this.path.index]) {
        return this.nodeList[this.nodeIndex].onError[this.path.index].color;
      }
    } else {
      if(this.path?.path?.color != null || this.path?.path?.color != undefined){
        return this.path.path.color;
      }
      if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onSuccess && this.nodeList[this.nodeIndex].onSuccess[this.path.index]) {
        return this.nodeList[this.nodeIndex].onSuccess[this.path.index].color;
      }
    }
  }

  set color(color: string) {
    if (this.pathType == 'error') {
      if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onError && this.nodeList[this.nodeIndex].onError[this.path.index]) {
        this.nodeList[this.nodeIndex].onError[this.path.index].color = color || "F44336";
      }
    } else {
      if(this.path?.path && this.nodeList[this.nodeIndex]?.onSuccess){
        this.nodeList[this.nodeIndex].onSuccess.find(node => node._id === this.path.path._id).color = color;
      }
    else  if (this.nodeList[this.nodeIndex] && this.nodeList[this.nodeIndex].onSuccess && this.nodeList[this.nodeIndex].onSuccess[this.path.index]) {
        this.nodeList[this.nodeIndex].onSuccess[this.path.index].color = color;
      }
    }
  }
}
