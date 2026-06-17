import { Component, Input, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-panoramic-viewer',
  standalone: true,
  imports: [IonSpinner],
  template: `
    <div #canvasContainer class="canvas-container"></div>
    @if (loading) {
      <div class="loading-overlay">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
    }

    .canvas-container {
      width: 100%;
      height: 100%;
    }

    .loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
    }

    ion-spinner {
      width: 48px;
      height: 48px;
      color: #fff;
    }
  `]
})
export class PanoramicViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;
  @Input() imagePath: string = '';

  loading = true;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationFrameId: number | null = null;

  ngAfterViewInit() {
    setTimeout(() => {
      this.initThreeJS();
      if (this.imagePath) {
        this.loadPanorama();
      }
    }, 0);
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.controls?.dispose();
    this.renderer?.dispose();
  }

  private initThreeJS() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.canvasContainer.nativeElement.clientWidth / this.canvasContainer.nativeElement.clientHeight,
      1,
      1100
    );
    this.camera.position.set(0, 0, 0.1);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.canvasContainer.nativeElement.clientWidth,
      this.canvasContainer.nativeElement.clientHeight
    );
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.5;

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation loop
    this.animate();
  }

  private loadPanorama() {
    const loader = new THREE.TextureLoader();
    loader.load(
      this.imagePath,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;

        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);

        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
        this.scene.add(mesh);
        this.loading = false;
      },
      undefined,
      (error) => {
        console.error('Error loading panoramic image:', error);
        this.loading = false;
      }
    );
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    const width = this.canvasContainer.nativeElement.clientWidth;
    const height = this.canvasContainer.nativeElement.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }
}
