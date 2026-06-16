import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
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
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, InnerViewListComponent, RouterLink],
})
export class HomePage implements OnInit {
  innerViewItems: InnerViewItem[] = [];
  private innerViewService = inject(InnerViewService);

  constructor() {
    addIcons({ personCircleOutline });
  }

  ngOnInit() {
    this.innerViewService.getInnerViewList().subscribe({
      next: (items) => {
        this.innerViewItems = items;
      },
      error: (error) => {
        console.error('Error loading inner view items:', error);
      }
    });
  }
}
