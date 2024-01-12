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
    @Input() nodeList: Array<any>;
    @Input() flowData: any = {};
    services: any = {};
    constructor(
      private flowService: B2bFlowService
    ) {
      this.handleContextMenu = this.handleContextMenu.bind(this);
      this.services['flowService'] = this.flowService
    }

    ngOnInit(): void {
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
  
  
    ngOnChanges(changes: SimpleChanges): void {
      this.render();
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
            <ReactFlowComponent addNode={(e) => this.handleContextMenu(e)} nodeList={this.nodeList} services={this.services} changeNodeList={(e) => this.reRender(e)}/>
          </div>
        </React.StrictMode>,
        this.containerRef.nativeElement
      );
    }
  }