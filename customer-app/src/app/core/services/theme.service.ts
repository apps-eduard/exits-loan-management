import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private darkMode = false;

  constructor() {
    this.loadTheme();
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    
    if (savedTheme) {
      this.darkMode = savedTheme === 'dark';
    } else {
      // Check system preference
      this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    this.applyTheme();
  }

  private applyTheme() {
    const htmlElement = document.documentElement;
    
    if (this.darkMode) {
      htmlElement.classList.add('ion-palette-dark', 'dark');
    } else {
      htmlElement.classList.remove('ion-palette-dark', 'dark');
    }
    
    localStorage.setItem(this.THEME_KEY, this.darkMode ? 'dark' : 'light');
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    this.applyTheme();
  }

  setDarkMode(isDark: boolean) {
    this.darkMode = isDark;
    this.applyTheme();
  }

  isDarkMode(): boolean {
    return this.darkMode;
  }

  // Listen to system theme changes
  watchSystemTheme() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const savedTheme = localStorage.getItem(this.THEME_KEY);
      // Only apply system theme if user hasn't set a preference
      if (!savedTheme) {
        this.darkMode = e.matches;
        this.applyTheme();
      }
    });
  }
}
