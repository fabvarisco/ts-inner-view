import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg } from '@ionic/angular/standalone';
import { InnerViewItem } from '../../models/inner-view.model';

@Component({
  selector: 'app-inner-view-card',
  templateUrl: './inner-view-card.component.html',
  styleUrls: ['./inner-view-card.component.scss'],
  standalone: true,
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg]
})
export class InnerViewCardComponent {
  @Input() item!: InnerViewItem;
  @Input() index!: number;

  private router = inject(Router);

  // Keep legacy inputs for backward compatibility
  @Input() name: string = '';
  @Input() thumb: string = '';
  @Input() descriptions: string = '';

  onCardClick() {
    this.router.navigate(['/inner-view-page', this.index], {
      state: { item: this.item }
    });
  }
}
