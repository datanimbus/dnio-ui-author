import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges,
    OnDestroy, Output, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
  import * as React from "react";
  import * as ReactDOM from "react-dom";
import ReactFlowComponent from "./ReactFlowComponent";  


  const containerElementRef = "customReactComponentContainer";
  
  @Component({
    selector: "odp-react-flow",
    template: `<div #${containerElementRef}></div>`,
    styleUrls: ["./styles.scss"], 
    // styleUrls: [""],
    encapsulation: ViewEncapsulation.None,
  })
  export class CustomReactWrapperComponent implements OnChanges, OnDestroy, AfterViewInit {
    @ViewChild(containerElementRef, { static: true }) containerRef!: ElementRef;
    
    constructor() {
      this.handleClick = this.handleClick.bind(this);
    }
  
    public handleClick() {
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
            <ReactFlowComponent/>
          </div>
        </React.StrictMode>,
        this.containerRef.nativeElement
      );
    }
  }