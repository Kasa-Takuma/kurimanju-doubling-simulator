import { Color, Fog, Scene } from 'three';

export function installSky(scene: Scene): void {
  const sky = new Color(0x9dccf0);
  scene.background = sky;
  scene.fog = new Fog(sky, 110, 560);
}
