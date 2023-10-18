import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'odp-kafka-connector',
  templateUrl: './kafka-connector.component.html',
  styleUrls: ['./kafka-connector.component.scss']
})
export class KafkaConnectorComponent implements OnInit {

  @Input() edit: any;
  @Input() currNode: any;
  @Input() nodeList: Array<any>;
  type: string;
  
  constructor() { }

  ngOnInit(): void {
    this.type = this.currNode.type.split('_')[1];
  }

  onValueChange(value: any, type: any) {
      this.currNode.options[type] = value;
  }


}
