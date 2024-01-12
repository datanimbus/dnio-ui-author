import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges,
    OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
  import * as React from "react";
  import * as ReactDOM from "react-dom";
import ReactFlowComponent from "./ReactFlowComponent";  
import { B2bFlowService } from "../home/b2b-flows-manage/b2b-flow.service";


  const containerElementRef = "customReactComponentContainer";
  
  @Component({
    selector: "odp-react-flow",
    template: `<div #${containerElementRef}></div>`,
    styleUrls: ["./styles.scss"], 
    // styleUrls: [""],
    encapsulation: ViewEncapsulation.None,
  })
  export class CustomReactWrapperComponent implements OnChanges, OnDestroy, AfterViewInit, OnInit {
    @ViewChild(containerElementRef, { static: true }) containerRef!: ElementRef;
    @Output() public contextMenu = new EventEmitter<void>();
    @Output() public changeNodeList = new EventEmitter<void>();
    @Output() public openNodeProperty = new EventEmitter<void>();
    @Input() nodeList: Array<any>;
    @Input() flowData: any = {};
    @Input() edit: any = {};
    services: any = {};
    constructor(
      private flowService: B2bFlowService
    ) {
      this.handleContextMenu = this.handleContextMenu.bind(this);
      this.services['flowService'] = this.flowService;
      this.edit = {
        status: true
      }
    }

    ngOnInit(): void {

      this.services.flowService.reCreatePaths.subscribe(() => {
        this.reRender(this.nodeList);
      });
    }
  
    public handleContextMenu(event) {
      if (this.contextMenu) {
        this.contextMenu.emit(event);
        this.render();
      }
    }

    reRender(nodeList){
      this.nodeList = nodeList;
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
  
    ngOnChanges(changes: SimpleChanges): void {
      this.reRender(this.nodeList);
    }
  
    ngAfterViewInit() {
      this.render();
    }
  
    ngOnDestroy() {
      ReactDOM.unmountComponentAtNode(this.containerRef.nativeElement);
    }

    
    private render() {  
      ReactDOM.render(
        <React.StrictMode>
          <div id='reactStuff'>
            <ReactFlowComponent 
              edit={this.edit}
              addNode={(e) => this.handleContextMenu(e)} 
              nodeList={this.nodeList} 
              services={this.services} 
              changeNodeList={(e) => this.reRender(e)}
              openProperty={(e) => this.openProperty(e)}
              />
          </div>
        </React.StrictMode>,
        this.containerRef.nativeElement
      );
    }
  }