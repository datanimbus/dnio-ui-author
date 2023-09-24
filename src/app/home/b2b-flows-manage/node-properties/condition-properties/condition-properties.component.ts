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
    if (this.currNode && !this.currNode.conditions) {
      this.currNode.conditions = [];
    }
    if (this.currNode.conditions.length == 0) {
      this.currNode.conditions.push({});
    }
  }

  ngOnDestroy(): void {

  }

  onValueChange(value: string, item: any, key: string) {
    item[key] = value;
  }

  addCondition(event: any) {
    this.currNode.conditions.push({});
  }

  removeCondition(event: any, index: number) {
    this.currNode.conditions.splice(index, 1);
  }

  get conditionList() {
    return this.currNode.conditions;
  }
}
