import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { InnerViewListComponent } from '../components/inner-view-list/inner-view-list.component';
import { InnerViewService } from '../services/inner-view.service';
import { InnerViewItem } from '../models/inner-view.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, InnerViewListComponent],
})
export class HomePage implements OnInit {
  innerViewItems: InnerViewItem[] = [];
  private innerViewService = inject(InnerViewService);

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
