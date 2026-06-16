import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
  IonAvatar, IonImg, IonSegment, IonSegmentButton, IonLabel,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonModal, IonActionSheet, IonItem, IonTextarea, IonToast
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  heartOutline, shareSocialOutline, starOutline,
  pencilOutline, trashOutline, closeOutline, copyOutline
} from 'ionicons/icons';
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
    IonButton, IonIcon, IonModal, IonActionSheet, IonItem, IonTextarea, IonToast,
    InnerViewCardComponent
  ]
})
export class ProfilePage implements OnInit {
  private userService = inject(UserService);

  user: UserProfile | null = null;
  uploads: UserUpload[] = [];
  favorites: FavoriteItem[] = [];

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
    this.userService.getUserUploads().subscribe({ next: (u) => (this.uploads = u) });
    this.userService.getFavorites().subscribe({ next: (f) => (this.favorites = f) });
  }

  onSegmentChange(event: any) {
    this.activeSegment = event.detail.value;
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
        text: 'Renomear',
        icon: 'pencil-outline',
        handler: () => {
          this.showToast('Funcionalidade em breve');
        }
      },
      {
        text: 'Excluir',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => {
          this.showToast('Funcionalidade em breve');
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }
    ];
    this.isEditSheetOpen = true;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copiado!');
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
