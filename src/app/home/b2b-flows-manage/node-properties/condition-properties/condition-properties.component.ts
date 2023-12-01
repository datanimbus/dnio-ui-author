import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { B2bFlowService } from '../../b2b-flow.service';

@Component({
  selector: 'odp-condition-properties',
  templateUrl: './condition-properties.component.html',
  styleUrls: ['./condition-properties.component.scss']
})
export class ConditionPropertiesComponent implements OnInit, OnDestroy {

  @Input() edit: any;
  @Input() currNode: any;
  @Input() nodeList: Array<any>;
  constructor(private flowService: B2bFlowService) {

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
    this.flowService.reCreatePaths.emit();
  }

  onConditionTypeChange(event: any, type: string) {
    if (event) {
      this.currNode.options.conditionType = type;
    }
  }

  get conditionList() {
    return this.currNode.conditions;
  }

  get conditionType() {
    return this.currNode.options.conditionType || 'ifElse';
  }
}
