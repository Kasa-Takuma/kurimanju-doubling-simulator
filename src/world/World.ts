import { Scene, Vector3 } from 'three';
import { installLighting } from '../renderer/Lighting';
import { installSky } from './Sky';
import { Terrain } from './Terrain';

export class World {
  readonly scene = new Scene();
  readonly terrain = new Terrain();
  readonly ready = Promise.resolve();

  constructor() {
    this.scene.name = 'kurimanju-world';
    installSky(this.scene);
    installLighting(this.scene);
    this.terrain.addTo(this.scene);
  }

  update(cameraPosition: Vector3): void {
    this.terrain.update(this.scene, cameraPosition.x, cameraPosition.z);
  }

  reset(): void {
    this.update(new Vector3(0, 0, 0));
  }
}
