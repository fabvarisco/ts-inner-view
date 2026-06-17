import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
  IonAvatar, IonImg, IonSegment, IonSegmentButton, IonLabel,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonModal, IonActionSheet, IonItem, IonTextarea, IonToast, IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  heartOutline, shareSocialOutline, starOutline,
  pencilOutline, trashOutline, closeOutline, copyOutline
} from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InnerViewCardComponent } from '../components/inner-view-card/inner-view-card.component';
import { UserService } from '../services/user.service';
import { UserProfile, UserUpload, FavoriteItem } from '../models/user.model';
import { InnerViewItem } from '../models/inner-view.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
    IonAvatar, IonImg, IonSegment, IonSegmentButton, IonLabel,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonIcon, IonModal, IonActionSheet, IonItem, IonTextarea, IonToast, IonSearchbar,
    InnerViewCardComponent,
    TranslatePipe
  ]
})
export class ProfilePage implements OnInit {
  private userService = inject(UserService);
  private translate = inject(TranslateService);

  user: UserProfile | null = null;
  uploads: UserUpload[] = [];
  filteredUploads: UserUpload[] = [];
  favorites: FavoriteItem[] = [];
  filteredFavorites: FavoriteItem[] = [];

  activeSegment = 'uploads';

  isEmbedModalOpen = false;
  embedLink = '';
  embedCode = '';

  isEditSheetOpen = false;
  editSheetButtons: any[] = [];

  isToastOpen = false;
  toastMessage = '';

  constructor() {
    addIcons({ heartOutline, shareSocialOutline, starOutline, pencilOutline, trashOutline, closeOutline, copyOutline });
  }

  ngOnInit() {
    this.userService.getUser().subscribe({ next: (u) => (this.user = u) });
    this.userService.getUserUploads().subscribe({ next: (u) => { this.uploads = u; this.filteredUploads = u; } });
    this.userService.getFavorites().subscribe({ next: (f) => { this.favorites = f; this.filteredFavorites = f; } });
  }

  onSegmentChange(event: any) {
    this.activeSegment = event.detail.value;
  }

  onSearchUploads(event: any) {
    const query = event.detail.value?.toLowerCase().trim() ?? '';
    this.filteredUploads = query
      ? this.uploads.filter(u =>
          u.name.toLowerCase().includes(query) ||
          u.descriptions.toLowerCase().includes(query)
        )
      : this.uploads;
  }

  onSearchFavorites(event: any) {
    const query = event.detail.value?.toLowerCase().trim() ?? '';
    this.filteredFavorites = query
      ? this.favorites.filter(f =>
          f.name.toLowerCase().includes(query) ||
          f.descriptions.toLowerCase().includes(query)
        )
      : this.favorites;
  }

  openEmbedModal(upload: UserUpload) {
    const origin = window.location.origin;
    this.embedLink = `${origin}/embed/${upload.id}`;
    this.embedCode = `<iframe src="${origin}/embed/${upload.id}" width="800" height="600" frameborder="0" allowfullscreen></iframe>`;
    this.isEmbedModalOpen = true;
  }

  openEditSheet(upload: UserUpload) {
    this.editSheetButtons = [
      {
        text: this.translate.instant('PROFILE.ACTION_SHEET.RENAME'),
        icon: 'pencil-outline',
        handler: () => {
          this.showToast(this.translate.instant('PROFILE.TOAST.COMING_SOON'));
        }
      },
      {
        text: this.translate.instant('PROFILE.ACTION_SHEET.DELETE'),
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => {
          this.showToast(this.translate.instant('PROFILE.TOAST.COMING_SOON'));
        }
      },
      {
        text: this.translate.instant('PROFILE.ACTION_SHEET.CANCEL'),
        role: 'cancel'
      }
    ];
    this.isEditSheetOpen = true;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(this.translate.instant('PROFILE.TOAST.COPIED'));
    });
  }

  asFavoriteInnerViewItem(fav: FavoriteItem): InnerViewItem {
    return fav as InnerViewItem;
  }

  private showToast(message: string) {
    this.toastMessage = message;
    this.isToastOpen = true;
  }
}
