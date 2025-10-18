# Theme System Guide - Exits Loan Management

## Overview
This application uses **Ionic Framework's built-in theming system** for dark/light mode support. Tailwind CSS was removed in favor of a cleaner, more performant solution.

## Dark/Light Mode Implementation

### Theme Service
Location: `src/app/core/services/theme.service.ts`

The `ThemeService` handles:
- ✅ Automatic system preference detection
- ✅ Manual theme toggling
- ✅ Theme persistence in localStorage
- ✅ Dynamic theme switching

### How It Works

1. **Initialization** (app.component.ts):
```typescript
constructor(private themeService: ThemeService) {
  this.themeService.watchSystemTheme();
}
```

2. **Toggle Theme** (any component):
```typescript
toggleTheme() {
  this.themeService.toggleTheme();
  this.isDarkMode = this.themeService.isDarkMode();
}
```

3. **Check Current Theme**:
```typescript
isDarkMode = this.themeService.isDarkMode();
```

## Ionic Dark Mode Configuration

### Global Styles (`global.scss`)
```scss
/* Enable class-based dark mode */
@import '@ionic/angular/css/palettes/dark.class.css';
```

This uses Ionic's class-based dark mode, which adds the `ion-palette-dark` class to `<html>` when dark mode is active.

## Theme Toggle Locations

### 1. Login Page
- **Location**: Top-right corner
- **Component**: Floating Action Button (FAB)
- **Icon**: Moon (light mode) / Sun (dark mode)

### 2. Profile Page
- **Location**: Actions card
- **Component**: Toggle switch
- **Label**: "Dark Mode"

## Styling Best Practices

### Use Ionic CSS Variables
```scss
// Good ✅
background: var(--ion-color-primary);
color: var(--ion-text-color);

// Avoid ❌
background: #3880ff;
color: #000000;
```

### Common Variables
```scss
// Colors
--ion-color-primary
--ion-color-secondary
--ion-color-tertiary
--ion-color-success
--ion-color-warning
--ion-color-danger
--ion-color-light
--ion-color-medium
--ion-color-dark

// Text
--ion-text-color
--ion-text-color-rgb

// Background
--ion-background-color
--ion-card-background
--ion-item-background

// Shadows
--ion-box-shadow
```

## Customizing Theme Colors

### Edit Theme Variables
Location: `src/theme/variables.scss`

```scss
:root {
  --ion-color-primary: #3880ff;
  --ion-color-primary-rgb: 56, 128, 255;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #3171e0;
  --ion-color-primary-tint: #4c8dff;
}
```

## Benefits Over Tailwind

1. **Performance**: 
   - Smaller bundle size
   - Faster mobile performance
   - No extra CSS framework overhead

2. **Consistency**:
   - All components use the same design system
   - Native look and feel on iOS/Android

3. **Maintainability**:
   - Single theming system
   - Less complexity
   - Ionic-specific optimizations

4. **Mobile-First**:
   - Optimized for mobile devices
   - Better touch interactions
   - Platform-specific styling

## Testing Dark/Light Mode

### Manual Testing
1. Open the app
2. Click the theme toggle button (moon/sun icon)
3. Verify all pages switch themes correctly
4. Check that preference persists on reload

### System Preference
1. Change your OS dark/light mode setting
2. Reload the app (without saved preference)
3. App should match system preference

## Future Enhancements

- [ ] Add theme transition animations
- [ ] Create custom color palettes
- [ ] Add more theme options (e.g., high contrast)
- [ ] Sync theme across tabs

## Files Modified

### Customer App
- `src/app/core/services/theme.service.ts` (created)
- `src/app/app.component.ts` (theme initialization)
- `src/app/features/auth/pages/login/` (theme toggle)
- `src/app/features/profile/pages/profile/` (theme toggle)
- `src/global.scss` (dark mode import)

### Collector App
- `src/app/core/services/theme.service.ts` (created)
- `src/global.scss` (dark mode import)

## Removed Dependencies

```bash
npm uninstall tailwindcss postcss autoprefixer
```

Removed files:
- `tailwind.config.js`
- Tailwind imports from `global.scss`

---

**Last Updated**: October 18, 2025  
**Ionic Version**: 8.x  
**Angular Version**: 20.x
