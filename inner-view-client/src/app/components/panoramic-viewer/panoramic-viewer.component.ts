import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-panoramic-viewer',
  standalone: true,
  template: `
    <div #canvasContainer class="canvas-container"></div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .canvas-container {
      width: 100%;
      height: 100%;
    }
  `]
})
export class PanoramicViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;
  @Input() imagePath: string = '';

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationFrameId: number | null = null;

  ngOnInit() {
    this.initThreeJS();
  }

  ngAfterViewInit() {
    if (this.imagePath) {
      this.loadPanorama();
    }
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

        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        // Scale negatively to see inside
        geometry.scale(-1, 1, 1);

        // Create material with texture
        const material = new THREE.MeshBasicMaterial({
          map: texture
        });

        // Create mesh and add to scene
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
      },
      undefined,
      (error) => {
        console.error('Error loading panoramic image:', error);
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
