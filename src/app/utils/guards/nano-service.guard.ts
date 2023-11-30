import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonService } from '../services/common.service';

@Injectable({
  providedIn: 'root'
})
export class NanoServiceGuard  {
  constructor(private router: Router, private commonService: CommonService) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.commonService.hasPermissionStartsWith('PMNS')
      || this.commonService.hasPermissionStartsWith('PVNS')) {
      return true;
    } else {
      this.router.navigate(['/app', this.commonService.app._id, 'agent']);
      return false;
    }
  }
}
