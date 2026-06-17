import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';
import { InnerViewListComponent } from '../components/inner-view-list/inner-view-list.component';
import { InnerViewService } from '../services/inner-view.service';
import { InnerViewItem } from '../models/inner-view.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, InnerViewListComponent, RouterLink],
})
export class HomePage implements OnInit {
  innerViewItems: InnerViewItem[] = [];
  filteredItems: InnerViewItem[] = [];
  private innerViewService = inject(InnerViewService);

  constructor() {
    addIcons({ personCircleOutline });
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
