import { GridHelper, LineBasicMaterial, Mesh, MeshStandardMaterial, PlaneGeometry, Scene } from 'three';

export const TERRAIN_CHUNK_SIZE = 64;
export const GRID_CELL_SIZE_M = 0.1;
export const GRID_SIZE_M = TERRAIN_CHUNK_SIZE / 8;
export const GRID_DIVISIONS = Math.round(GRID_SIZE_M / GRID_CELL_SIZE_M);
const ACTIVE_RADIUS = 3;

export class Terrain {
  private readonly geometry = new PlaneGeometry(TERRAIN_CHUNK_SIZE, TERRAIN_CHUNK_SIZE, 32, 32);
  private readonly material = new MeshStandardMaterial({
    color: 0x777b80,
    roughness: 1,
    metalness: 0,
  });
  private readonly grid = new GridHelper(GRID_SIZE_M, GRID_DIVISIONS, 0x51565d, 0x969ba1);
  private readonly chunks = new Map<string, Mesh>();
  private lastCenterX = Number.NaN;
  private lastCenterZ = Number.NaN;
  private lastGridCenterX = Number.NaN;
  private lastGridCenterZ = Number.NaN;

  constructor() {
    this.grid.name = 'field-grid';
    this.grid.position.y = 0.001;
    this.grid.renderOrder = 1;
    if (this.grid.material instanceof LineBasicMaterial) {
      this.grid.material.transparent = true;
      this.grid.material.opacity = 0.48;
      this.grid.material.depthWrite = false;
    }
  }

  addTo(scene: Scene): void {
    this.update(scene, 0, 0);
  }

  update(scene: Scene, cameraX: number, cameraZ: number): void {
    const gridCenterX = Math.round(cameraX / GRID_SIZE_M) * GRID_SIZE_M;
    const gridCenterZ = Math.round(cameraZ / GRID_SIZE_M) * GRID_SIZE_M;
    if (gridCenterX !== this.lastGridCenterX || gridCenterZ !== this.lastGridCenterZ) {
      this.lastGridCenterX = gridCenterX;
      this.lastGridCenterZ = gridCenterZ;
      this.grid.position.set(gridCenterX, 0.001, gridCenterZ);
      scene.add(this.grid);
    }

    const centerX = Math.floor(cameraX / TERRAIN_CHUNK_SIZE);
    const centerZ = Math.floor(cameraZ / TERRAIN_CHUNK_SIZE);
    if (centerX === this.lastCenterX && centerZ === this.lastCenterZ) {
      return;
    }
    this.lastCenterX = centerX;
    this.lastCenterZ = centerZ;

    const needed = new Set<string>();
    for (let x = centerX - ACTIVE_RADIUS; x <= centerX + ACTIVE_RADIUS; x += 1) {
      for (let z = centerZ - ACTIVE_RADIUS; z <= centerZ + ACTIVE_RADIUS; z += 1) {
        const key = `${x}:${z}`;
        needed.add(key);
        let chunk = this.chunks.get(key);
        if (!chunk) {
          chunk = new Mesh(this.geometry, this.material);
          chunk.rotation.x = -Math.PI / 2;
          chunk.receiveShadow = true;
          chunk.name = `terrain-${key}`;
          this.chunks.set(key, chunk);
        }
        scene.add(chunk);
        chunk.position.set(x * TERRAIN_CHUNK_SIZE + TERRAIN_CHUNK_SIZE / 2, 0, z * TERRAIN_CHUNK_SIZE + TERRAIN_CHUNK_SIZE / 2);
      }
    }

    for (const [key, chunk] of this.chunks) {
      if (!needed.has(key)) {
        scene.remove(chunk);
      }
    }
  }

  sampleHeight(x: number, z: number): number {
    // The visual terrain is a flat plane and the physics ground has its top at y=0.
    // Keep both surfaces aligned so the 6.5 cm model does not appear to float.
    void x;
    void z;
    return 0;
  }
}
