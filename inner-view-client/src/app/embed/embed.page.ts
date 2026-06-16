import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { PanoramicViewerComponent } from '../components/panoramic-viewer/panoramic-viewer.component';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-embed',
  templateUrl: './embed.page.html',
  styleUrls: ['./embed.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, PanoramicViewerComponent]
})
export class EmbedPage implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  imagePath = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.userService.getUserUploads().subscribe({
      next: (uploads) => {
        const upload = uploads.find(u => u.id === id);
        if (upload && upload.panoramicPoints.length > 0) {
          this.imagePath = `/assets/panoramic/${upload.panoramicPoints[0]}`;
        }
      }
    });
  }
}
