import {
  Color,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Scene,
  Vector3,
} from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { attribute } from 'three/tsl';
import { KurimanjuAssetsResult } from './KurimanjuAssets';
import { LODLevel, selectLOD } from './KurimanjuLOD';

export interface RenderableInstance {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scale: number;
  variation: number;
}

export interface KurimanjuRenderStats {
  visibleInstanceCount: number;
  lodCounts: [number, number, number, number];
}

const MAX_INSTANCES_PER_LOD = [4000, 8000, 12000, 18000] as const;

export class KurimanjuRenderer {
  readonly group = new Group();
  private readonly meshes: InstancedMesh[] = [];
  private readonly fadeAttributes: InstancedBufferAttribute[] = [];
  private readonly previousLOD = new Map<number, LODLevel>();
  private readonly matrix = new Matrix4();
  private readonly quaternion = new Quaternion();
  private readonly position = new Vector3();
  private readonly scale = new Vector3();
  private readonly axisY = new Vector3(0, 1, 0);
  private readonly color = new Color();
  private readonly stats: KurimanjuRenderStats = {
    visibleInstanceCount: 0,
    lodCounts: [0, 0, 0, 0],
  };
  private assetsStatus = 'placeholder';

  constructor(assets: KurimanjuAssetsResult) {
    assets.lods.forEach((asset, lod) => {
      const source = asset.material instanceof MeshStandardMaterial ? asset.material : null;
      const material = new MeshStandardNodeMaterial({
        color: source?.color ?? 0x9b4e29,
        map: source?.map ?? null,
        normalMap: source?.normalMap ?? null,
        normalScale: source?.normalScale,
        roughness: Math.max(0.4, source?.roughness ?? 0.74),
        roughnessMap: source?.roughnessMap ?? null,
        aoMap: source?.aoMap ?? null,
        aoMapIntensity: source?.aoMapIntensity ?? 1,
        metalness: Math.min(0.05, source?.metalness ?? 0),
      });
      material.vertexColors = true;
      material.transparent = true;
      material.depthWrite = false;
      material.opacityNode = attribute('instanceFade', 'float');
      const mesh = new InstancedMesh(asset.geometry, material, MAX_INSTANCES_PER_LOD[lod]);
      const fadeAttribute = new InstancedBufferAttribute(new Float32Array(MAX_INSTANCES_PER_LOD[lod]), 1);
      fadeAttribute.setUsage(DynamicDrawUsage);
      fadeAttribute.array.fill(1);
      asset.geometry.setAttribute('instanceFade', fadeAttribute);
      this.fadeAttributes.push(fadeAttribute);
      mesh.name = `kurimanju-lod${lod}`;
      mesh.count = 0;
      mesh.castShadow = lod <= 1;
      mesh.receiveShadow = lod <= 2;
      mesh.frustumCulled = false;
      this.meshes.push(mesh);
      this.group.add(mesh);
    });
    this.assetsStatus = assets.requiredModelMissing
      ? 'GLB未提供: 開発用placeholderで表示中'
      : `${assets.loadedFiles.length}個のGLB LODを読み込み済み`;
  }

  addTo(scene: Scene): void {
    scene.add(this.group);
  }

  update(instances: readonly RenderableInstance[], cameraPosition: Vector3): void {
    const buckets: RenderableInstance[][] = [[], [], [], []];
    this.stats.lodCounts = [0, 0, 0, 0];

    for (let index = 0; index < instances.length; index += 1) {
      const instance = instances[index];
      const distance = Math.hypot(instance.x - cameraPosition.x, instance.z - cameraPosition.z);
      const lod = selectLOD(distance, this.previousLOD.get(index) ?? null);
      this.previousLOD.set(index, lod);
      const bucket = buckets[lod];
      if (bucket.length < MAX_INSTANCES_PER_LOD[lod]) {
        bucket.push(instance);
      }
    }

    for (let lod = 0; lod < this.meshes.length; lod += 1) {
      const mesh = this.meshes[lod];
      const bucket = buckets[lod];
      for (let index = 0; index < bucket.length; index += 1) {
        const instance = bucket[index];
        this.position.set(instance.x, instance.y, instance.z);
        this.quaternion.setFromAxisAngle(this.axisY, instance.rotationY);
        this.scale.setScalar(instance.scale);
        this.matrix.compose(this.position, this.quaternion, this.scale);
        mesh.setMatrixAt(index, this.matrix);
        this.fadeAttributes[lod].setX(index, Math.min(1, Math.max(0, (distanceFromCamera(instance, cameraPosition) - 0.006) / 0.08)));
        this.color.setHSL(0.055 + instance.variation * 0.008, 0.58, 0.34 + instance.variation * 0.035);
        mesh.setColorAt(index, this.color);
      }
      mesh.count = bucket.length;
      mesh.instanceMatrix.needsUpdate = true;
      this.fadeAttributes[lod].needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      this.stats.lodCounts[lod] = bucket.length;
    }
    this.stats.visibleInstanceCount = this.stats.lodCounts.reduce((sum, count) => sum + count, 0);
  }

  getStats(): KurimanjuRenderStats {
    return {
      visibleInstanceCount: this.stats.visibleInstanceCount,
      lodCounts: [...this.stats.lodCounts] as [number, number, number, number],
    };
  }

  getAssetStatus(): string {
    return this.assetsStatus;
  }
}

function distanceFromCamera(instance: RenderableInstance, cameraPosition: Vector3): number {
  return Math.hypot(instance.x - cameraPosition.x, instance.y - cameraPosition.y, instance.z - cameraPosition.z);
}
