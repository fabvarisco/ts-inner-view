import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonPopover, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { personCircleOutline, globeOutline, checkmarkOutline, cloudUploadOutline } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { InnerViewListComponent } from '../components/inner-view-list/inner-view-list.component';
import { InnerViewService } from '../services/inner-view.service';
import { InnerViewItem } from '../models/inner-view.model';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonPopover, IonList, IonItem, IonLabel, InnerViewListComponent, RouterLink, TranslatePipe],
})
export class HomePage implements OnInit {
  innerViewItems: InnerViewItem[] = [];
  filteredItems: InnerViewItem[] = [];
  isLangPopoverOpen = false;
  langPopoverEvent?: Event;
  private innerViewService = inject(InnerViewService);
  languageService = inject(LanguageService);

  constructor() {
    addIcons({ personCircleOutline, globeOutline, checkmarkOutline, cloudUploadOutline });
  }

  openLanguagePopover(event: Event) {
    this.langPopoverEvent = event;
    this.isLangPopoverOpen = true;
  }

  selectLang(lang: 'pt' | 'en') {
    this.languageService.use(lang);
    this.isLangPopoverOpen = false;
  }

  ngOnInit() {
    this.innerViewService.getInnerViewList().subscribe({
      next: (items) => {
        this.innerViewItems = items;
        this.filteredItems = items;
      },
      error: (error) => {
        console.error('Error loading inner view items:', error);
      }
    });
  }

  onSearch(event: any) {
    const query = event.detail.value?.toLowerCase().trim() ?? '';
    this.filteredItems = query
      ? this.innerViewItems.filter(item =>
          item.name.toLowerCase().includes(query) ||
          item.descriptions.toLowerCase().includes(query)
        )
      : this.innerViewItems;
  }
}
