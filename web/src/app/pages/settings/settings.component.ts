import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      <div class="card">
        <p class="text-gray-600 dark:text-gray-400">System settings coming soon...</p>
      </div>
    </div>
  `
})
export class SettingsComponent {}
