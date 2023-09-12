import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'odp-masking-property',
  templateUrl: './masking-property.component.html',
  styleUrls: ['./masking-property.component.scss']
})
export class MaskingPropertyComponent implements OnInit {

  @Input() edit: any;
  @Input() form: FormGroup;
  maskingType: string;
  showCharacters: number;
  constructor() {
    this.maskingType = 'no';
    this.showCharacters = 5;
    this.edit = {
      status: false
    };
  }

  ngOnInit(): void {
    if (this.form) {
      let val: string = this.form.get('properties.masking').value;
      if (val) {
        if (val == 'no' || val == 'all') {
          this.maskingType = val;
        } else if (val.startsWith('some')) {
          this.maskingType = 'some';
          this.showCharacters = parseInt(val.split('_')[1], 10);
        }
      }
    }
  }

  onTypeChange(val: string) {
    if (val == 'no' || val == 'all') {
      this.form.get('properties.masking').patchValue(val);
    } else {
      this.form.get('properties.masking').patchValue(val + '_' + this.showCharacters);
    }
  }

  onCharacterChange(val: number) {
    this.form.get('properties.masking').patchValue('some_' + val);
  }
}
