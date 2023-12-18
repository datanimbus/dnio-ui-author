import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { fromEvent } from 'rxjs';

@Directive({
  selector: '[odpViewBox]'
})
export class ViewBoxDirective implements AfterViewInit {

  @Input() move: EventEmitter<{ left: number, top: number }>;
  @Input() zoomAction: EventEmitter<any>;
  @Output() moved: EventEmitter<{ left: number, top: number }>;
  wrapper: HTMLElement;
  svg: SVGElement;
  startX: number;
  startY: number;
  width: number;
  height: number;
  initialWidth: number;
  initialHeight: number;
  constructor(private ele: ElementRef) {
    this.startX = 0;
    this.startY = 0;
    this.width = 3000;
    this.height = 1000;
    this.wrapper = this.ele.nativeElement.parentElement;
    this.move = new EventEmitter();
    this.zoomAction = new EventEmitter();
    this.moved = new EventEmitter();
  }

  ngAfterViewInit() {
    // this.move.subscribe(data => {
    //   this.startX = data.left;
    //   this.startY = data.top;
    //   this.left = 0;
    //   this.top = 0;
    //   this.svg.setAttribute('viewBox', `${this.startX} ${this.startY} ${this.wrapper.clientWidth} ${this.wrapper.clientHeight}`);
    // });
    this.initialWidth = window.innerWidth * 2;
    this.initialHeight = window.innerHeight * 2;
    this.zoomAction.subscribe((action: string) => {
      if (action == 'out') {
        this.zoomInOut(100);
      } else if (action == 'in') {
        this.zoomInOut(-100);
      } else {
        this.width = this.initialWidth;
        this.height = this.initialHeight;
        this.svg.setAttribute('viewBox', `${this.startX} ${this.startY} ${this.width} ${this.height}`);
      }
    });
    this.svg = (this.ele.nativeElement as SVGElement);
    this.width = this.initialWidth;
    this.height = this.initialHeight;
    this.svg.setAttribute('viewBox', `${this.startX} ${this.startY} ${this.width} ${this.height}`);
    this.drawGrid(this.wrapper.clientWidth, this.wrapper.clientHeight);
    fromEvent(this.ele.nativeElement, 'wheel').subscribe({
      next: (event: any) => {
        if (event.metaKey) {
          event.preventDefault();
          this.zoomInOut(event.deltaY);
        }
      },
      error: (err) => {

      },
    });

    // fromEvent(this.ele.nativeElement, 'mousedown').pipe(
    //   switchMap((start: MouseEvent) => {
    //     return fromEvent(document, 'mousemove').pipe(
    //       map((move: MouseEvent) => {
    //         move.preventDefault();
    //         return {
    //           left: start.clientX - move.clientX,
    //           top: start.clientY - move.clientY
    //         };
    //       }),
    //       takeUntil(fromEvent(document, 'mouseup').pipe(map(end => {
    //         this.startX = this.left;
    //         this.startY = this.top;
    //       })))
    //     );
    //   })
    // ).subscribe((ev: any) => {
    //   const x = this.startX + ev.left;
    //   const y = this.startY + ev.top;
    //   this.left = x > 0 ? x : 0;
    //   this.top = y > 0 ? y : 0;
    //   this.svg.setAttribute('viewBox', `${x > 0 ? x : 0} ${y > 0 ? y : 0} ${this.wrapper.clientWidth} ${this.wrapper.clientHeight}`);
    //   this.moved.emit({
    //     left: this.left,
    //     top: this.top
    //   });
    // });

  }

  drawGrid(windowWidth: number, windowHeight: number) {
    const colCount = (windowWidth * 3) / 10 + 1;
    const rowCount = (windowHeight * 3) / 10 + 1;
    const group: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGElement;
    group.setAttribute('id', 'grid');
    for (let i = 0; i < rowCount; i++) {
      for (let j = 0; j < colCount; j++) {
        const distX = 10 * (j) - windowWidth;
        const distY = 10 * (i + 1);
        const ele: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle') as SVGElement;
        ele.setAttribute('cx', `${distX}`);
        ele.setAttribute('cy', `${distY}`);
        ele.setAttribute('r', `1`);
        ele.setAttribute('fill', `rgba(0,0,0,0.1)`);
        group.appendChild(ele);
      }
    }
    (this.ele.nativeElement as SVGElement).prepend(group);
    // (this.ele.nativeElement as SVGElement).insertBefore(group, (this.ele.nativeElement as SVGElement).children[0]);
  }

  zoomInOut(delta: number) {
    this.width += delta;
    this.height += delta;
    if (this.width < this.initialWidth) {
      this.width = this.initialWidth;
    }
    if (this.height < this.initialHeight) {
      this.height = this.initialHeight;
    }
    this.svg.setAttribute('viewBox', `${this.startX} ${this.startY} ${this.width} ${this.height}`);
  }
}
