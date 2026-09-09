import { PerspectiveCamera, Scene } from 'three';
import { RenderPipeline, WebGPURenderer } from 'three/webgpu';
import { mrt, normalView, output, pass, vec3, vec4 } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';

export class PostProcessing {
  private pipeline: RenderPipeline | null = null;

  configure(renderer: WebGPURenderer, scene: Scene, camera: PerspectiveCamera): void {
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, normal: normalView }));
    const sceneColor = scenePass.getTextureNode('output');
    const sceneDepth = scenePass.getTextureNode('depth');
    const sceneNormal = scenePass.getTextureNode('normal');
    const aoPass = ao(sceneDepth, sceneNormal, camera);
    aoPass.resolutionScale = 0.5;
    aoPass.radius.value = 0.42;
    aoPass.thickness.value = 0.18;

    this.pipeline = new RenderPipeline(renderer);
    this.pipeline.outputNode = sceneColor.mul(vec4(vec3(aoPass.getTextureNode().r), 1));
  }

  render(fallback: () => void): void {
    if (this.pipeline) {
      this.pipeline.render();
      return;
    }
    fallback();
  }
}
