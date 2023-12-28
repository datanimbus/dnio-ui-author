import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'odp-foreach-properties',
  templateUrl: './foreach-properties.component.html',
  styleUrls: ['./foreach-properties.component.scss']
})
export class ForeachPropertiesComponent implements OnInit {

  @Input() flowData: any;
  @Input() edit: any;
  @Input() data: any;
  @Output() close: EventEmitter<any>;
  constructor() {
    this.close = new EventEmitter();
  }

  ngOnInit(): void {

  }
}
