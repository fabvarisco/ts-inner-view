import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList } from '@ionic/angular/standalone';
import { InnerViewItem } from '../../models/inner-view.model';
import { InnerViewCardComponent } from '../inner-view-card/inner-view-card.component';

@Component({
  selector: 'app-inner-view-list',
  templateUrl: './inner-view-list.component.html',
  styleUrls: ['./inner-view-list.component.scss'],
  standalone: true,
  imports: [CommonModule, IonList, InnerViewCardComponent]
})
export class InnerViewListComponent {
  @Input() items: InnerViewItem[] = [];
}
