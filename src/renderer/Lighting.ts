import { DirectionalLight, HemisphereLight, Scene } from 'three';

export function installLighting(scene: Scene): void {
  const sun = new DirectionalLight(0xffffff, 3.2);
  sun.position.set(-45, 70, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 180;
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.bias = -0.0002;
  scene.add(sun);

  const skyLight = new HemisphereLight(0xdde5ee, 0x60656b, 1.35);
  scene.add(skyLight);
}
