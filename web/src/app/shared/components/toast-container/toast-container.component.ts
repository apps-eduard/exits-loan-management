import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      @for (toast of toastService.getToasts()(); track toast.id) {
        <div
          class="toast-item flex items-start p-4 rounded-lg shadow-lg border transition-all duration-300 ease-in-out transform"
          [ngClass]="getToastClasses(toast.type)"
          role="alert"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 mr-3">
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
              }
              @case ('info') {
                <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
              }
            }
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium" [ngClass]="getTextClass(toast.type)">
              {{ toast.message }}
            </p>

            @if (toast.action) {
              <button
                type="button"
                class="mt-2 text-xs font-medium underline hover:no-underline"
                [ngClass]="getActionClass(toast.type)"
                (click)="toast.action!.handler()"
              >
                {{ toast.action.label }}
              </button>
            }
          </div>

          <!-- Close button -->
          <button
            type="button"
            class="flex-shrink-0 ml-3 p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
            [ngClass]="getCloseButtonClass(toast.type)"
            (click)="removeToast(toast.id)"
            aria-label="Close notification"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-item {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  removeToast(id: string): void {
    this.toastService.removeToast(id);
  }

  getToastClasses(type: Toast['type']): string {
    const baseClasses = 'bg-white border-l-4';
    switch (type) {
      case 'success':
        return `${baseClasses} border-green-500`;
      case 'error':
        return `${baseClasses} border-red-500`;
      case 'warning':
        return `${baseClasses} border-yellow-500`;
      case 'info':
        return `${baseClasses} border-blue-500`;
      default:
        return `${baseClasses} border-gray-500`;
    }
  }

  getTextClass(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  }

  getActionClass(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-700 hover:text-green-600';
      case 'error':
        return 'text-red-700 hover:text-red-600';
      case 'warning':
        return 'text-yellow-700 hover:text-yellow-600';
      case 'info':
        return 'text-blue-700 hover:text-blue-600';
      default:
        return 'text-gray-700 hover:text-gray-600';
    }
  }

  getCloseButtonClass(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-600 hover:text-green-800 focus:ring-green-500';
      case 'error':
        return 'text-red-600 hover:text-red-800 focus:ring-red-500';
      case 'warning':
        return 'text-yellow-600 hover:text-yellow-800 focus:ring-yellow-500';
      case 'info':
        return 'text-blue-600 hover:text-blue-800 focus:ring-blue-500';
      default:
        return 'text-gray-600 hover:text-gray-800 focus:ring-gray-500';
    }
  }
}
