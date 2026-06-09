import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { InnerViewItem } from '../models/inner-view.model';
import { InnerViewService } from '../services/inner-view.service';
import { PanoramicViewerComponent } from '../components/panoramic-viewer/panoramic-viewer.component';

@Component({
  selector: 'app-inner-view-page',
  templateUrl: './inner-view-page.page.html',
  styleUrls: ['./inner-view-page.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    CommonModule, FormsModule, PanoramicViewerComponent
  ]
})
export class InnerViewPagePage implements OnInit {
  currentItem: InnerViewItem | null = null;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private innerViewService = inject(InnerViewService);

  ngOnInit() {
    // Try to get item from router state first
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['item']) {
      this.currentItem = navigation.extras.state['item'] as InnerViewItem;
    } else {
      // Fallback: fetch from service using route param
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.innerViewService.getInnerViewList().subscribe({
          next: (items) => {
            const index = parseInt(id, 10);
            if (index >= 0 && index < items.length) {
              this.currentItem = items[index];
            }
          },
          error: (error) => {
            console.error('Error loading item:', error);
          }
        });
      }
    }
  }

  getPanoramicPath(): string {
    if (this.currentItem && this.currentItem.panoramicPoints.length > 0) {
      return `/assets/panoramic/${this.currentItem.panoramicPoints[0]}`;
    }
    return '';
  }
}
