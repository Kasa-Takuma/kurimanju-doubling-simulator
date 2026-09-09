import { Mesh, MeshStandardMaterial, PlaneGeometry, Scene } from 'three';
import { positiveModulo } from '../utils/math';

export const TERRAIN_CHUNK_SIZE = 64;
const ACTIVE_RADIUS = 3;

export class Terrain {
  private readonly geometry = new PlaneGeometry(TERRAIN_CHUNK_SIZE, TERRAIN_CHUNK_SIZE, 32, 32);
  private readonly material = new MeshStandardMaterial({
    color: 0x63864b,
    roughness: 0.96,
    metalness: 0,
  });
  private readonly chunks = new Map<string, Mesh>();
  private lastCenterX = Number.NaN;
  private lastCenterZ = Number.NaN;

  addTo(scene: Scene): void {
    this.update(scene, 0, 0);
  }

  update(scene: Scene, cameraX: number, cameraZ: number): void {
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
        chunk.position.set(x * TERRAIN_CHUNK_SIZE + TERRAIN_CHUNK_SIZE / 2, -0.03, z * TERRAIN_CHUNK_SIZE + TERRAIN_CHUNK_SIZE / 2);
      }
    }

    for (const [key, chunk] of this.chunks) {
      if (!needed.has(key)) {
        scene.remove(chunk);
      }
    }
  }

  sampleHeight(x: number, z: number): number {
    // A stable, very shallow variation keeps the ground from looking mathematical
    // while remaining gentle enough that settled bodies do not roll forever.
    return Math.sin(x * 0.045) * 0.018 + Math.cos(z * 0.037) * 0.014 + positiveModulo(x + z, 1) * 0.001;
  }
}
