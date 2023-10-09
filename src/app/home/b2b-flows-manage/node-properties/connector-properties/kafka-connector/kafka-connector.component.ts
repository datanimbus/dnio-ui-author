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
    this.type = this.currNode?.options?.connectorType || '';
  }

  onValueChange(value: any, type: any) {
    if (type) {
      this.currNode.options[type] = (type === 'count' || type === 'page') && value && !isNaN(value) ? parseInt(value) : value;
    }
  }


}
