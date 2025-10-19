import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);

  getToasts() {
    return this.toasts.asReadonly();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private addToast(toast: Omit<Toast, 'id'>): void {
    const id = this.generateId();
    const newToast: Toast = { ...toast, id };

    this.toasts.update(toasts => [...toasts, newToast]);

    // Auto-remove toast after duration (default 4 seconds)
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
  }

  success(message: string, duration?: number, action?: Toast['action']): void {
    this.addToast({ message, type: 'success', duration, action });
  }

  error(message: string, duration?: number, action?: Toast['action']): void {
    this.addToast({ message, type: 'error', duration: duration ?? 6000, action });
  }

  warning(message: string, duration?: number, action?: Toast['action']): void {
    this.addToast({ message, type: 'warning', duration, action });
  }

  info(message: string, duration?: number, action?: Toast['action']): void {
    this.addToast({ message, type: 'info', duration, action });
  }

  removeToast(id: string): void {
    this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
