import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges,
    OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
  import * as React from "react";
  import * as ReactDOM from "react-dom";
  import {createRoot} from 'react-dom/client';
import ReactFlowComponent from "./ReactFlowComponent";  
import { B2bFlowService } from "../home/b2b-flows-manage/b2b-flow.service";


  const containerElementRef = "customReactComponentContainer";
  
  @Component({
    selector: "odp-react-flow",
    template: `<div #${containerElementRef}></div>`,
    styleUrls: ["./reactflow.scss"], 
    // styleUrls: [""],
    encapsulation: ViewEncapsulation.None,
  })
  export class CustomReactWrapperComponent implements OnChanges, OnDestroy, AfterViewInit, OnInit {
    @ViewChild(containerElementRef, { static: true }) containerRef!: ElementRef;
    @Output() public onAddNode = new EventEmitter<void>();
    @Output() public changeNodeList = new EventEmitter<void>();
    @Output() public openNodeProperty = new EventEmitter<void>();
    @Input() nodeList: Array<any>;
    @Input() flowData: any = {};
    @Input() edit: any = {};
    services: any = {};
    constructor(
      private flowService: B2bFlowService
    ) {
      this.services['flowService'] = this.flowService;
      this.edit = {
        status: true
      }
    }

    ngOnInit(): void {
      // this.checkPaths();
      this.services.flowService.reCreatePaths.subscribe(() => {
        this.reRender(this.nodeList);
      });
    }
  
    addNode(event) {
      if (this.onAddNode) {
        this.onAddNode.emit(event);
        this.render();
      }
    }

    getNodeError(id) {
      const errors = this.getErrors().filter(obj => obj.id === id);
      return errors;
    }
  
    getErrors() {
      const validations = this.flowService.getErrorValidations();
  
      const finalList = (this.nodeList ||[]).reduce((acc, node) => {
        const nodeValidations = (validations.find(e => {
          return e.node === node.type
        }) || {}).validations || [];
  
        const errors = nodeValidations
          .map(item => {
            if (item['subType']) {
              if (item['subType'] === (node.options.connectorType) || node.options[item['subType'].toLowerCase()])
                return this.checkErrors(item, node);
              else {
                return null
              }
            }
            else {
              return this.checkErrors(item, node)
            }
          })
          .filter(Boolean);
  
        if (errors.length) acc.push(errors);
  
        return acc;
      }, []);
      return finalList.flat()
    }


    checkErrors(item, node) {
      if (item.condition && Object.getOwnPropertyNames(item.condition).includes('inputNode')) {
        const isInputNode = this.isInputNode(node);
        if (item.condition.inputNode !== isInputNode) {
          return null;
        }
      }
      const value = item.fieldPath.split('.').reduce((obj, key) => obj?.[key], node)
      if (item.type === 'required' && (!value || value.length < 1)) {
        return {
          node: node.name,
          id: node._id,
          error: item.error
        };
      }
      return null;
    }


  isInputNode(node) {
    if (this.flowData && node) {
      return this.flowData.inputNode._id == node._id;
    }
    return true;
    // return this.nodeList[0]._id == this.currNode._id;
  }

    reRender(nodeList){
      this.nodeList = nodeList;
      this.flowService.selectedNode.emit(null)
      this.changeNodeList.emit(nodeList)
      this.render();
    }
  
    openProperty(nodeId){
      const currNode = this.nodeList.find(e => e._id == nodeId);
      const prevNode = this.nodeList.find((e: any) => (e.onSuccess || []).find(ei => ei._id == nodeId));
      this.flowService.selectedNode.emit({
        currNode: currNode,
        prevNode: prevNode
      });

    }

    openEdgeProperty(edge: any){
      const data = edge.data;
      const index = data.index || 0;
      const path = this.convertToPath(edge, data);
     
      this.flowService.selectedPath.emit({ index, path });
      console.log(edge);
    }

    convertToPath(edge,data){
      this.flowService.selectedNode.emit(null);
      const path =  edge.data;
      path['type'] = edge.targetHandle;
      const prevNode = this.nodeList.find(e => e._id == edge.target)._id;
      path['prevNode'] = prevNode;
      return path;
    }

    checkPaths() {
      this.nodeList.forEach(node => {
        node.onSuccess.forEach((success, index) => {
          if (!success.path) {
            success.path = [];
          }else{
            success.index = index
          }
        })
      })
    }
  
    ngOnChanges(changes: SimpleChanges): void {
      // this.checkPaths();
      this.reRender(this.nodeList);
    }
  
    ngAfterViewInit() {
      this.render();
    }
  
    ngOnDestroy() {
      ReactDOM.unmountComponentAtNode(this.containerRef.nativeElement);
    }

    
    private render() {  
      const errorList = this.nodeList.map(node => {
        return {
          _id: node._id,
          errors: this.getNodeError(node._id)
        }
      })
      // createRoot( this.containerRef.nativeElement)
      ReactDOM.render(
        <React.StrictMode>
          <div id='reactStuff'>
            <ReactFlowComponent 
              edit={this.edit}
              addNode={(e) => this.addNode(e)} 
              nodeList={this.nodeList} 
              services={this.services} 
              changeNodeList={(e) => this.reRender(e)}
              openProperty={(e) => this.openProperty(e)}
              openPath={(e) => this.openEdgeProperty(e)}
              errorList={errorList}
              />
          </div>
        </React.StrictMode>,
       this.containerRef.nativeElement
      );
    }
  }