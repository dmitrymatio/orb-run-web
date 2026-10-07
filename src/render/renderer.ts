import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import type { GameScene } from './gameScene';

export type RendererBundle = Readonly<{
  renderer: THREE.WebGPURenderer;
  renderPipeline: THREE.RenderPipeline;
  backend: 'WebGPU' | 'WebGL2';
}>;

export async function createRenderer( host: HTMLElement, gameScene: GameScene, forceWebGL: boolean ): Promise<RendererBundle> {
  const renderer = new THREE.WebGPURenderer( { antialias: true, forceWebGL } );
  renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.append( renderer.domElement );
  await renderer.init();

  const scenePass = pass( gameScene.scene, gameScene.camera );
  const sceneColor = scenePass.getTextureNode( 'output' );
  const bloomPass = bloom( sceneColor, 1.15, 0.32, 0.18 );
  const renderPipeline = new THREE.RenderPipeline( renderer );
  renderPipeline.outputNode = sceneColor.add( bloomPass );

  const backend = renderer.backend as typeof renderer.backend & { isWebGPUBackend?: boolean };
  return { renderer, renderPipeline, backend: backend.isWebGPUBackend ? 'WebGPU' : 'WebGL2' };
}
