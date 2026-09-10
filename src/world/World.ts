import { Scene, Vector3 } from 'three';
import { installLighting } from '../renderer/Lighting';
import { Grass } from './Grass';
import { installSky } from './Sky';
import { Terrain } from './Terrain';

export class World {
  readonly scene = new Scene();
  readonly terrain = new Terrain();
  readonly grass: Grass;
  readonly ready: Promise<void>;

  constructor() {
    this.scene.name = 'kurimanju-world';
    this.grass = new Grass((x, z) => this.terrain.sampleHeight(x, z));
    installSky(this.scene);
    installLighting(this.scene);
    this.terrain.addTo(this.scene);
    this.grass.addTo(this.scene);
    this.ready = this.grass.ready;
  }

  update(cameraPosition: Vector3, timeSeconds = 0): void {
    this.terrain.update(this.scene, cameraPosition.x, cameraPosition.z);
    this.grass.update(cameraPosition.x, cameraPosition.z, timeSeconds);
  }

  reset(): void {
    this.update(new Vector3(0, 0, 0));
  }
}
