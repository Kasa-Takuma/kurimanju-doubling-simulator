import {
  BufferGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Euler,
  Group,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Scene,
  NoColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { randomFor } from '../utils/random';

const GRASS_URL = `${import.meta.env.BASE_URL}assets/models/grass/grass_medium_01_1k.gltf`;
const GRASS_ALPHA_URL = `${import.meta.env.BASE_URL}assets/models/grass/textures/grass_medium_01_alpha_1k.png`;
const GRASS_PATCH_SIZE = 48;
const GRASS_COUNT = 6200;
const GRASS_WORLD_SCALE = 0.62;
const CLUSTER_COUNT = 180;
const MAX_INSTANCES_PER_VARIANT = 1800;
const PATCH_STEP = 16;
const CLEAR_RADIUS = 0.45;

const GRASS_VARIANT_NAMES = [
  'grass_medium_01_small_a_LOD0',
  'grass_medium_01_small_b_LOD0',
  'grass_medium_01_mid_b_LOD0',
  'grass_medium_01_mid_c_LOD0',
  'grass_medium_01_tall_a_LOD0',
  'grass_medium_01_tall_c_LOD0',
] as const;

type HeightSampler = (x: number, z: number) => number;

interface GrassInstance {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scale: number;
  variation: number;
  phase: number;
  windStrength: number;
}

interface GrassVariant {
  name: string;
  mesh: InstancedMesh | null;
  instances: GrassInstance[];
}

export class Grass {
  readonly ready: Promise<void>;
  private readonly group = new Group();
  private readonly loader = new GLTFLoader();
  private readonly textureLoader = new TextureLoader();
  private readonly heightAt: HeightSampler;
  private readonly fallbackMesh: InstancedMesh;
  private readonly patchCenter = new Vector3(Number.NaN, 0, Number.NaN);
  private readonly placements: GrassInstance[] = [];
  private readonly variants: GrassVariant[] = GRASS_VARIANT_NAMES.map((name) => ({
    name,
    mesh: null,
    instances: [],
  }));
  private readonly position = new Vector3();
  private readonly scale = new Vector3();
  private readonly matrix = new Matrix4();
  private readonly quaternion = new Quaternion();
  private readonly euler = new Euler(0, 0, 0, 'YXZ');
  private readonly color = new Color();
  private currentTime = 0;
  private hasRealAsset = false;

  constructor(heightAt: HeightSampler) {
    this.heightAt = heightAt;
    const fallbackGeometry = new PlaneGeometry(0.045, 0.16, 2, 3);
    fallbackGeometry.translate(0, 0.08, 0);
    const fallbackMaterial = new MeshStandardMaterial({
      color: 0x5d813e,
      roughness: 0.92,
      side: DoubleSide,
    });
    this.fallbackMesh = new InstancedMesh(fallbackGeometry, fallbackMaterial, GRASS_COUNT);
    this.fallbackMesh.name = 'fallback-grass';
    this.fallbackMesh.count = 0;
    this.fallbackMesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.fallbackMesh.castShadow = false;
    this.fallbackMesh.receiveShadow = false;
    this.group.add(this.fallbackMesh);
    this.ready = this.loadRealAsset();
  }

  addTo(scene: Scene): void {
    scene.add(this.group);
    this.rebuild(0, 0);
  }

  update(cameraX: number, cameraZ: number, timeSeconds = this.currentTime): void {
    const centerX = Math.floor(cameraX / PATCH_STEP) * PATCH_STEP;
    const centerZ = Math.floor(cameraZ / PATCH_STEP) * PATCH_STEP;
    this.currentTime = timeSeconds;
    if (centerX !== this.patchCenter.x || centerZ !== this.patchCenter.z) {
      this.rebuild(centerX, centerZ);
      return;
    }
    this.writeMatrices(timeSeconds);
  }

  private async loadRealAsset(): Promise<void> {
    try {
      const gltf = await this.loader.loadAsync(GRASS_URL);
      const alphaMap = await this.textureLoader.loadAsync(GRASS_ALPHA_URL);
      alphaMap.colorSpace = NoColorSpace;
      alphaMap.flipY = false;
      alphaMap.needsUpdate = true;
      gltf.scene.updateMatrixWorld(true);
      let loadedVariantCount = 0;

      for (let index = 0; index < this.variants.length; index += 1) {
        const source = this.findMesh(gltf.scene, this.variants[index].name);
        if (!source) {
          continue;
        }
        const geometry = this.prepareGeometry(source);
        const material = this.prepareMaterial(source.material, alphaMap);
        const mesh = new InstancedMesh(geometry, material, MAX_INSTANCES_PER_VARIANT);
        mesh.name = this.variants[index].name;
        mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
        this.variants[index].mesh = mesh;
        this.group.add(mesh);
        loadedVariantCount += 1;
      }

      if (loadedVariantCount === 0) {
        throw new Error('配布モデル内に利用可能な草株がありません');
      }

      this.hasRealAsset = true;
      this.group.remove(this.fallbackMesh);
      this.fallbackMesh.geometry.dispose();
      const fallbackMaterial = this.fallbackMesh.material;
      if (Array.isArray(fallbackMaterial)) {
        fallbackMaterial.forEach((material) => material.dispose());
      } else {
        fallbackMaterial.dispose();
      }
      if (Number.isFinite(this.patchCenter.x) && Number.isFinite(this.patchCenter.z)) {
        this.rebuild(this.patchCenter.x, this.patchCenter.z);
      }
    } catch {
      // 起動を止めず、配布モデルが取得できない場合だけ開発用の軽量表示を残す。
      this.hasRealAsset = false;
    }
  }

  private rebuild(centerX: number, centerZ: number): void {
    this.patchCenter.set(centerX, 0, centerZ);
    this.placements.length = 0;
    for (const variant of this.variants) {
      variant.instances.length = 0;
    }

    const random = randomFor(centerX, centerZ, 0x47524153);
    const clusters = Array.from({ length: CLUSTER_COUNT }, () => ({
      x: centerX + random.range(-GRASS_PATCH_SIZE / 2, GRASS_PATCH_SIZE / 2),
      z: centerZ + random.range(-GRASS_PATCH_SIZE / 2, GRASS_PATCH_SIZE / 2),
    }));

    let attempts = 0;
    while (this.placements.length < GRASS_COUNT && attempts < GRASS_COUNT * 4) {
      attempts += 1;
      const cluster = clusters[random.integer(clusters.length)];
      const clustered = random.next() < 0.74;
      const x = clustered
        ? cluster.x + random.signed(1.15)
        : centerX + random.range(-GRASS_PATCH_SIZE / 2, GRASS_PATCH_SIZE / 2);
      const z = clustered
        ? cluster.z + random.signed(1.15)
        : centerZ + random.range(-GRASS_PATCH_SIZE / 2, GRASS_PATCH_SIZE / 2);
      if (Math.hypot(x, z) < CLEAR_RADIUS) {
        continue;
      }

      const instance: GrassInstance = {
        x,
        y: this.heightAt(x, z),
        z,
        rotationY: random.range(0, Math.PI * 2),
        scale: random.range(0.78, 1.16) * GRASS_WORLD_SCALE,
        variation: random.signed(0.5),
        phase: random.range(0, Math.PI * 2),
        windStrength: random.range(0.55, 1),
      };
      this.placements.push(instance);
      this.variants[this.selectVariant(random.next())].instances.push(instance);
    }

    if (this.hasRealAsset) {
      this.writeColors();
    }
    this.writeMatrices(this.currentTime);
  }

  private writeMatrices(timeSeconds: number): void {
    if (!this.hasRealAsset) {
      for (let index = 0; index < this.placements.length; index += 1) {
        this.writeInstance(this.fallbackMesh, index, this.placements[index], timeSeconds);
        this.color.set(0.7, 0.88, 0.48);
        this.fallbackMesh.setColorAt(index, this.color);
      }
      this.fallbackMesh.count = this.placements.length;
      this.fallbackMesh.instanceMatrix.needsUpdate = true;
      if (this.fallbackMesh.instanceColor) {
        this.fallbackMesh.instanceColor.needsUpdate = true;
      }
      return;
    }

    for (const variant of this.variants) {
      if (!variant.mesh) {
        continue;
      }
      const visibleCount = Math.min(variant.instances.length, MAX_INSTANCES_PER_VARIANT);
      for (let index = 0; index < visibleCount; index += 1) {
        const instance = variant.instances[index];
        this.writeInstance(variant.mesh, index, instance, timeSeconds);
      }
      variant.mesh.count = visibleCount;
      variant.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  private writeColors(): void {
    for (const variant of this.variants) {
      if (!variant.mesh) {
        continue;
      }
      const visibleCount = Math.min(variant.instances.length, MAX_INSTANCES_PER_VARIANT);
      for (let index = 0; index < visibleCount; index += 1) {
        const instance = variant.instances[index];
        this.color.set(
          1 + instance.variation * 0.035,
          1 + instance.variation * 0.025,
          1 + instance.variation * 0.045,
        );
        variant.mesh.setColorAt(index, this.color);
      }
      if (variant.mesh.instanceColor) {
        variant.mesh.instanceColor.needsUpdate = true;
      }
    }
  }

  private writeInstance(mesh: InstancedMesh, index: number, instance: GrassInstance, timeSeconds: number): void {
    const windPhase = timeSeconds * 1.25 + instance.phase + instance.x * 1.7 + instance.z * 1.35;
    const gustPhase = timeSeconds * 0.43 + instance.phase * 0.61;
    const leanX = Math.sin(windPhase) * 0.085 * instance.windStrength + Math.sin(gustPhase) * 0.025;
    const leanZ = Math.cos(windPhase * 0.91) * 0.07 * instance.windStrength;
    this.position.set(instance.x, instance.y, instance.z);
    this.euler.set(leanX, instance.rotationY, leanZ, 'YXZ');
    this.quaternion.setFromEuler(this.euler);
    this.scale.setScalar(instance.scale);
    this.matrix.compose(this.position, this.quaternion, this.scale);
    mesh.setMatrixAt(index, this.matrix);
  }

  private selectVariant(value: number): number {
    if (value < 0.25) {
      return 0;
    }
    if (value < 0.5) {
      return 1;
    }
    if (value < 0.7) {
      return 2;
    }
    if (value < 0.87) {
      return 3;
    }
    if (value < 0.94) {
      return 4;
    }
    return 5;
  }

  private findMesh(root: Object3D, name: string): Mesh | null {
    let result: Mesh | null = null;
    root.traverse((object) => {
      if (!result && object instanceof Mesh && object.name === name) {
        result = object;
      }
    });
    return result;
  }

  private prepareGeometry(source: Mesh): BufferGeometry {
    const geometry = source.geometry.clone();
    geometry.applyMatrix4(source.matrixWorld);
    geometry.computeBoundingBox();
    if (!geometry.boundingBox) {
      return geometry;
    }
    const bounds = geometry.boundingBox;
    geometry.translate(
      -(bounds.min.x + bounds.max.x) / 2,
      -bounds.min.y,
      -(bounds.min.z + bounds.max.z) / 2,
    );
    geometry.computeBoundingSphere();
    return geometry;
  }

  private prepareMaterial(source: Material | Material[], alphaMap: Texture): MeshStandardMaterial {
    const material = Array.isArray(source) ? source[0] : source;
    const normalized = material instanceof MeshStandardMaterial
      ? material.clone()
      : new MeshStandardMaterial({ color: 0x6f9b45, roughness: 0.88, metalness: 0 });
    normalized.side = DoubleSide;
    normalized.vertexColors = true;
    normalized.transparent = false;
    normalized.depthWrite = true;
    normalized.alphaTest = 0.35;
    normalized.alphaMap = alphaMap;
    normalized.emissive.setRGB(0.08, 0.14, 0.04);
    normalized.emissiveIntensity = 0.35;
    normalized.metalness = 0;
    normalized.roughness = Math.max(0.82, normalized.roughness);
    return normalized;
  }
}
