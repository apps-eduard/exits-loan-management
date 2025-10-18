import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            {{ label }}
          </p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {{ value }}
          </p>
          @if (change) {
            <p class="text-sm mt-2 flex items-center" 
               [ngClass]="{
                 'text-green-600 dark:text-green-400': changeType === 'positive',
                 'text-red-600 dark:text-red-400': changeType === 'negative',
                 'text-gray-600 dark:text-gray-400': changeType === 'neutral'
               }">
              @if (changeType === 'positive') {
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              }
              @if (changeType === 'negative') {
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              }
              {{ change }}
            </p>
          }
        </div>
        <div class="flex-shrink-0">
          <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
               [style.backgroundColor]="iconBgColor"
               [style.color]="iconColor">
            {{ icon }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StatCardComponent {
  @Input() label!: string;
  @Input() value!: string | number;
  @Input() icon: string = '📊';
  @Input() iconColor: string = '#3B82F6';
  @Input() iconBgColor: string = '#EFF6FF';
  @Input() change?: string;
  @Input() changeType?: 'positive' | 'negative' | 'neutral';
}
