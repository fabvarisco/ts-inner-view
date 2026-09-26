# Inner View — Arquitetura do Frontend

## Visão Geral

Aplicação mobile-first construída com **Angular 20** + **Ionic 8** + **Capacitor 8**. Roda no browser e em dispositivos Android (via Capacitor). O viewer panorâmico é renderizado com **Three.js** diretamente em um `<canvas>`.

---

## Stack

| Camada       | Tecnologia                         |
| ------------ | ---------------------------------- |
| Framework    | Angular 20 (standalone components) |
| Linguagem    | TypeScript 5.9                     |
| UI / Mobile  | Ionic 8 + Capacitor 8              |
| 3D / Viewer  | Three.js + OrbitControls           |
| Internac.    | @ngx-translate                     |
| HTTP         | Angular HttpClient + proxy `/api`  |
| Autenticação | JWT armazenado em `localStorage`   |

---

## Viewer Panorâmico (Three.js)

O `PanoramicViewerComponent` renderiza tours 360° usando uma esfera invertida (`SphereGeometry scale(-1,1,1)`), com a textura da panorama aplicada internamente.

```
PanoramicViewerComponent
├── THREE.Scene
│   ├── SphereGeometry (r=500, invertida) ← textura base64 da panorama
│   └── THREE.Sprite[] ← hotspots renderizados com CanvasTexture
├── PerspectiveCamera (FOV 75)
├── WebGLRenderer
└── OrbitControls (sem pan, com zoom)
```

**Hotspots** são `THREE.Sprite` posicionados via coordenadas UV (positionX, positionY) convertidas para coordenadas esféricas 3D. Ao clicar num hotspot, o viewer navega para a panorama de destino.

**Modo de edição** (`editMode=true`): clique no canvas emite coordenadas UV via `@Output() hotspotPlaced`, permitindo posicionar novos hotspots interativamente.
