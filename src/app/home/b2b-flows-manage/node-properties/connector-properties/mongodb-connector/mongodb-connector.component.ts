import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'odp-mongodb-connector',
  templateUrl: './mongodb-connector.component.html',
  styleUrls: ['./mongodb-connector.component.scss']
})
export class MongodbConnectorComponent implements OnInit {

  @Input() edit: any;
  @Input() currNode: any;
  @Input() nodeList: Array<any>;
  toggle: any;

  constructor() {
    this.toggle = {};
  }

  ngOnInit(): void {
  }

}
