import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Structural directive to show/hide elements based on permissions
 * Usage:
 * <button *hasPermission="'manage_users'">Create User</button>
 * <div *hasPermission="['manage_users', 'view_users']">Content</div>
 * <div *hasPermission="['manage_users', 'view_users']; requireAll: true">Content</div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  @Input() hasPermission: string | string[] = [];
  @Input() hasPermissionRequireAll: boolean = false;

  ngOnInit() {
    this.updateView();
  }

  private updateView() {
    const permissions = Array.isArray(this.hasPermission) 
      ? this.hasPermission 
      : [this.hasPermission];

    const hasAccess = this.hasPermissionRequireAll
      ? permissions.every(p => this.authService.hasPermission(p))
      : permissions.some(p => this.authService.hasPermission(p));

    this.viewContainer.clear();
    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}

/**
 * Structural directive to show/hide elements when user LACKS permissions
 * Usage:
 * <div *lacksPermission="'manage_users'">You don't have access</div>
 */
@Directive({
  selector: '[lacksPermission]',
  standalone: true
})
export class LacksPermissionDirective implements OnInit {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  @Input() lacksPermission: string | string[] = [];

  ngOnInit() {
    this.updateView();
  }

  private updateView() {
    const permissions = Array.isArray(this.lacksPermission) 
      ? this.lacksPermission 
      : [this.lacksPermission];

    const lacksAccess = !permissions.some(p => this.authService.hasPermission(p));

    this.viewContainer.clear();
    if (lacksAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
