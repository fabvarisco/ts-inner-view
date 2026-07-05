import { Component, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonList, IonListHeader, IonSpinner, IonModal,
  AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, trashOutline, eyeOutline, closeOutline } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { PropertyService } from '../services/property.service';
import { VirtualTourService } from '../services/virtual-tour.service';
import { Panorama } from '../models/virtual-tour.model';
import { PanoramicViewerComponent } from '../components/panoramic-viewer/panoramic-viewer.component';

interface PanoramaItem {
  roomName: string;
  imageData: string;
  fileName: string;
}

@Component({
  selector: 'app-upload-tour',
  templateUrl: './upload-tour.page.html',
  styleUrls: ['./upload-tour.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonList, IonListHeader, IonSpinner, IonModal,
    PanoramicViewerComponent,
    TranslatePipe,
  ],
})
export class UploadTourPage {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  title = '';
  type = '';
  purpose = '';
  panoramas: PanoramaItem[] = [];
  submitting = false;
  isPreviewOpen = false;
  previewPanoramas: Panorama[] = [];

  readonly propertyTypes = ['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL', 'RURAL', 'OFFICE'];
  readonly purposes = ['SALE', 'RENT', 'SALE_OR_RENT'];

  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private virtualTourService = inject(VirtualTourService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private translate = inject(TranslateService);

  constructor() {
    addIcons({ addCircleOutline, trashOutline, eyeOutline, closeOutline });
  }

  get canSubmit(): boolean {
    return !!(this.title.trim() && this.type && this.purpose) && !this.submitting;
  }

  openFilePicker() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const roomName = await this.promptRoomName();
    if (!roomName) return;

    const imageData = await this.readFileAsDataUrl(file);
    this.panoramas.push({ roomName, imageData, fileName: file.name });
  }

  removePanorama(index: number) {
    this.panoramas.splice(index, 1);
  }

  openPreview() {
    this.previewPanoramas = this.panoramas.map((p, i) => ({
      id: `preview-${i}`,
      roomName: p.roomName,
      imageData: p.imageData,
      order: i,
      initialPanorama: i === 0,
      originHotspots: [],
      measurements: [],
    }));
    this.isPreviewOpen = true;
  }

  async onSubmit() {
    if (!this.canSubmit) return;

    this.submitting = true;
    try {
      const code = `IML-${Date.now().toString(36).toUpperCase()}`;
      const property = await firstValueFrom(
        this.propertyService.createProperty({
          code,
          title: this.title.trim(),
          type: this.type,
          purpose: this.purpose,
        })
      );

      if (this.panoramas.length > 0) {
        await firstValueFrom(
          this.virtualTourService.createTour(
            property.id,
            this.panoramas.map((p, i) => ({
              roomName: p.roomName,
              imageData: p.imageData,
              order: i,
              initialPanorama: i === 0,
            }))
          )
        );
      }

      await this.showToast('UPLOAD.SUCCESS', 'success');
      this.router.navigate(['/home']);
    } catch {
      this.showToast('UPLOAD.ERROR', 'danger');
    } finally {
      this.submitting = false;
    }
  }

  private async promptRoomName(): Promise<string | null> {
    const alert = await this.alertController.create({
      header: this.translate.instant('INNER_VIEW.ROOM_NAME_TITLE'),
      inputs: [{ name: 'roomName', type: 'text', placeholder: this.translate.instant('INNER_VIEW.ROOM_NAME_PLACEHOLDER') }],
      buttons: [
        { text: this.translate.instant('INNER_VIEW.CANCEL'), role: 'cancel' },
        { text: this.translate.instant('INNER_VIEW.CONFIRM'), role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss();
    const roomName = (data?.values?.roomName ?? '').trim();
    return role === 'confirm' && roomName ? roomName : null;
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private async showToast(messageKey: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: this.translate.instant(messageKey),
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
