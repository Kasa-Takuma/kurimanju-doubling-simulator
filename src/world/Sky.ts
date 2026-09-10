import { Color, Fog, Scene } from 'three';

export function installSky(scene: Scene): void {
  const sky = new Color(0xa9b0b8);
  scene.background = sky;
  scene.fog = new Fog(sky, 110, 560);
}
