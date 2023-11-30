import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonService } from '../services/common.service';

@Injectable({
  providedIn: 'root'
})
export class BookmarkGuard  {
  constructor(private router: Router, private commonService: CommonService) {
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      if (this.commonService.hasPermissionStartsWith('PMBM')
      || this.commonService.hasPermissionStartsWith('PVBM')) {
      return true;
    } else {
      this.router.navigate(['/app', this.commonService.app._id, 'cp', 'gr']);
      return false;
    }
  }
}
