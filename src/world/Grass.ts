import { DoubleSide, InstancedMesh, Matrix4, MeshStandardMaterial, PlaneGeometry, Quaternion, Scene, Vector3 } from 'three';
import { randomFor } from '../utils/random';

const GRASS_PATCH_SIZE = 52;
const GRASS_COUNT = 2800;

export class Grass {
  private readonly mesh: InstancedMesh;
  private readonly patchCenter = new Vector3(Number.NaN, 0, Number.NaN);
  private readonly dummy = new Vector3();
  private readonly matrix = new Matrix4();
  private readonly quaternion = new Quaternion();
  private readonly axisY = new Vector3(0, 1, 0);
  private readonly scaleVector = new Vector3();

  constructor() {
    const geometry = new PlaneGeometry(0.07, 0.42);
    geometry.translate(0, 0.21, 0);
    const material = new MeshStandardMaterial({
      color: 0x527844,
      roughness: 1,
      side: DoubleSide,
    });
    this.mesh = new InstancedMesh(geometry, material, GRASS_COUNT);
    this.mesh.name = 'near-grass';
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
  }

  addTo(scene: Scene): void {
    scene.add(this.mesh);
    this.rebuild(0, 0);
  }

  update(cameraX: number, cameraZ: number): void {
    const centerX = Math.floor(cameraX / 16) * 16;
    const centerZ = Math.floor(cameraZ / 16) * 16;
    if (centerX === this.patchCenter.x && centerZ === this.patchCenter.z) {
      return;
    }
    this.rebuild(centerX, centerZ);
  }

  private rebuild(centerX: number, centerZ: number): void {
    this.patchCenter.set(centerX, 0, centerZ);
    const random = randomFor(centerX, centerZ, 0x47524153);
    for (let index = 0; index < GRASS_COUNT; index += 1) {
      const x = centerX + random.range(-GRASS_PATCH_SIZE / 2, GRASS_PATCH_SIZE / 2);
      const z = centerZ + random.range(-GRASS_PATCH_SIZE / 2, GRASS_PATCH_SIZE / 2);
      const scale = random.range(0.65, 1.2);
      const angle = random.range(0, Math.PI);
      this.dummy.set(x, 0, z);
      this.mesh.setMatrixAt(index, this.dummyMatrix(x, z, scale, angle));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private dummyMatrix(x: number, z: number, scale: number, angle: number) {
    // Reuse a matrix through the mesh's public setter without creating a matrix
    // per blade. The temporary object is kept on the instance.
    this.quaternion.setFromAxisAngle(this.axisY, angle);
    this.scaleVector.set(scale, scale, scale);
    this.matrix.compose(this.dummy.set(x, 0, z), this.quaternion, this.scaleVector);
    return this.matrix;
  }
}
