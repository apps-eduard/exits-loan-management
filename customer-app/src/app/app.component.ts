import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './core/services/theme.service';
import { addIcons } from 'ionicons';
import { 
  moonOutline, 
  sunnyOutline, 
  lockClosedOutline, 
  informationCircleOutline,
  arrowBack,
  personOutline,
  mailOutline,
  callOutline,
  homeOutline,
  cashOutline,
  documentTextOutline,
  listOutline,
  personCircleOutline,
  logOutOutline,
  settingsOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private themeService: ThemeService) {
    // Register all icons used in the app
    addIcons({
      'moon-outline': moonOutline,
      'sunny-outline': sunnyOutline,
      'lock-closed-outline': lockClosedOutline,
      'information-circle-outline': informationCircleOutline,
      'arrow-back': arrowBack,
      'person-outline': personOutline,
      'mail-outline': mailOutline,
      'call-outline': callOutline,
      'home-outline': homeOutline,
      'cash-outline': cashOutline,
      'document-text-outline': documentTextOutline,
      'list-outline': listOutline,
      'person-circle-outline': personCircleOutline,
      'log-out-outline': logOutOutline,
      'settings-outline': settingsOutline
    });

    // Initialize theme on app startup
    this.themeService.watchSystemTheme();
  }
}
