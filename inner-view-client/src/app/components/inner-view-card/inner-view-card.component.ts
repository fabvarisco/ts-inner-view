import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg,
  IonButton, IonIcon, IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heartOutline, heart, starOutline, star, shareSocialOutline } from 'ionicons/icons';
import { InnerViewItem } from '../../models/inner-view.model';

@Component({
  selector: 'app-inner-view-card',
  templateUrl: './inner-view-card.component.html',
  styleUrls: ['./inner-view-card.component.scss'],
  standalone: true,
  imports: [NgIf, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg, IonButton, IonIcon, IonSkeletonText]
})
export class InnerViewCardComponent {
  @Input() item!: InnerViewItem;
  @Input() index!: number;
  @Input() likes = 0;
  @Input() shares = 0;

  @Output() likeChange = new EventEmitter<boolean>();
  @Output() favoriteChange = new EventEmitter<boolean>();
  @Output() shareClick = new EventEmitter<void>();

  liked = false;
  favorited = false;
  imageLoaded = false;

  private router = inject(Router);

  constructor() {
    addIcons({ heartOutline, heart, starOutline, star, shareSocialOutline });
  }

  onCardClick() {
    this.router.navigate(['/inner-view-page', this.index], {
      state: { item: this.item }
    });
  }

  onLike(event: Event) {
    event.stopPropagation();
    this.liked = !this.liked;
    this.likes += this.liked ? 1 : -1;
    this.likeChange.emit(this.liked);
  }

  onFavorite(event: Event) {
    event.stopPropagation();
    this.favorited = !this.favorited;
    this.favoriteChange.emit(this.favorited);
  }

  onShare(event: Event) {
    event.stopPropagation();
    this.shareClick.emit();
  }
}
