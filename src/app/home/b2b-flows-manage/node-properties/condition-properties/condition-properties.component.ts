import { Component, Input, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'odp-condition-properties',
  templateUrl: './condition-properties.component.html',
  styleUrls: ['./condition-properties.component.scss']
})
export class ConditionPropertiesComponent implements OnInit, OnDestroy {

  @Input() edit: any;
  @Input() currNode: any;
  @Input() nodeList: Array<any>;
  constructor() {

  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }
}
