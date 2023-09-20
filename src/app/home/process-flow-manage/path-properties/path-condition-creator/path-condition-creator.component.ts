import { Component, Input, Output, EventEmitter, OnInit, ViewChild, HostListener } from '@angular/core';
import { Observable, OperatorFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import * as _ from 'lodash';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { B2bFlowService } from 'src/app/home/b2b-flows-manage/b2b-flow.service';

@Component({
  selector: 'odp-path-condition-creator',
  templateUrl: './path-condition-creator.component.html',
  styleUrls: ['./path-condition-creator.component.scss']
})
export class PathConditionCreatorComponent implements OnInit {

  @ViewChild('typeAhead') typeAhead: NgbTypeahead;
  @Input() nodeList: Array<any>;
  @Input() value: string;
  @Input() prevNode: any;
  @Output() valueChange: EventEmitter<string>;
  @Input() edit: any;
  showConditionWindow: boolean;
  tempValue: string;
  segments: Array<{ label: string, value: string }>;
  logicalConditions: Array<string>;
  selectedSegmentIndex: number;
  textValue: string;
  constructor(private flowService: B2bFlowService) {
    this.nodeList = [];
    this.segments = [];
    this.logicalConditions = ['<', '>', '=', '!', '&&', '||', '(', ')'];
    this.valueChange = new EventEmitter();
    this.edit = {
      status: true
    }
  } 

  ngOnInit(): void {
    if (this.value) {
      this.segments = this.value.split(' ').map(e => {
        let t = this.variableSuggestions.find(item => item.value == e);
        if (t) {
          return t;
        }
        return { label: e, value: e };
      });
    }
  }

  unsetValue() {
    this.tempValue = null;
    this.value = '';
    this.valueChange.emit(null);
    this.segments.splice(0);
    this.showConditionWindow = false;
  }

  cancel() {
    this.showConditionWindow = false;
  }

  save() {
    // this.value = this.segments.map(e => e.value).join(' ');
    console.log(this.value);
    this.valueChange.emit(this.value);
    this.cancel();
  }


  selectItem(event: any) {
    this.segments.push(event.item);
    setTimeout(() => {
      this.typeAhead.writeValue(null);
    }, 100);
  }

  selectSegment(index: number) {
    this.selectedSegmentIndex = index;
  }

  createSegment(event: any) {
    if (event.target.value && event.target.value.trim()) {
      this.selectItem({ item: { label: event.target.value, value: event.target.value } });
    }
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (event.key == 'Backspace' && this.selectedSegmentIndex > -1) {
      this.segments.splice(this.selectedSegmentIndex, 1);
    }
    this.selectedSegmentIndex = -1;
  }

  isLogicalOperator(seg: { label: string, value: string }) {
    return this.logicalConditions.indexOf(seg.value) > -1;
  }

  get variableSuggestions() {
    return this.flowService.getSuggestions(this.prevNode)
  }

  changeLabel(event) {
    this.textValue = event;

    this.value = this.textValue;
  }

}
