import { BufferGeometry, Group, LatheGeometry, Material, Mesh, MeshStandardMaterial, Object3D, Vector2 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface KurimanjuLODAsset {
  geometry: BufferGeometry;
  material: Material;
  source: 'glb' | 'placeholder';
  url: string;
}

export interface KurimanjuAssetsResult {
  lods: KurimanjuLODAsset[];
  requiredModelMissing: boolean;
  loadedFiles: string[];
}

const LOD_URLS = [0, 1, 2, 3].map((lod) => `${import.meta.env.BASE_URL}assets/models/kurimanju/kurimanju_lod${lod}.glb`);

export class KurimanjuAssets {
  private readonly loader = new GLTFLoader();

  async load(): Promise<KurimanjuAssetsResult> {
    const lods: KurimanjuLODAsset[] = [];
    const loadedFiles: string[] = [];
    let requiredModelMissing = false;

    for (let index = 0; index < LOD_URLS.length; index += 1) {
      const url = LOD_URLS[index];
      try {
        const gltf = await this.loader.loadAsync(url);
        const mesh = this.findFirstMesh(gltf.scene);
        if (!mesh) {
          throw new Error(`モデル内にMeshがありません: ${url}`);
        }
        lods.push({
          geometry: mesh.geometry,
          material: this.normalizeMaterial(mesh.material),
          source: 'glb',
          url,
        });
        loadedFiles.push(url);
      } catch {
        if (index === 0) {
          requiredModelMissing = true;
        }
        lods.push(this.createPlaceholder(index, url));
      }
    }

    return { lods, requiredModelMissing, loadedFiles };
  }

  private findFirstMesh(root: Object3D): Mesh | null {
    let result: Mesh | null = null;
    root.traverse((object) => {
      if (!result && object instanceof Mesh) {
        result = object;
      }
    });
    return result;
  }

  private normalizeMaterial(material: Material | Material[]): Material {
    const source = Array.isArray(material) ? material[0] : material;
    if (source instanceof MeshStandardMaterial) {
      const clone = source.clone();
      clone.metalness = Math.min(0.05, clone.metalness);
      clone.roughness = Math.max(0.38, clone.roughness);
      return clone;
    }
    return new MeshStandardMaterial({ color: 0x9a4c27, roughness: 0.72, metalness: 0 });
  }

  private createPlaceholder(lod: number, url: string): KurimanjuLODAsset {
    const profile = [
      new Vector2(0, -0.014),
      new Vector2(0.014, -0.014),
      new Vector2(0.026, -0.010),
      new Vector2(0.032, -0.002),
      new Vector2(0.031, 0.006),
      new Vector2(0.026, 0.012),
      new Vector2(0.015, 0.015),
      new Vector2(0, 0.015),
    ];
    const segments = [48, 24, 14, 8][lod] ?? 8;
    const geometry = new LatheGeometry(profile, segments);
    geometry.computeVertexNormals();
    const material = new MeshStandardMaterial({
      color: 0x9b4e29,
      roughness: 0.74,
      metalness: 0,
    });
    return { geometry, material, source: 'placeholder', url };
  }
}
