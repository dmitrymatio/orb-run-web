import * as THREE from 'three/webgpu';
import type { GameState } from '../game/game';
import { createOrbMaterial } from './orbMaterial';

const OBSTACLES = [
  { x: -3.5, z: -7, width: 3.5, depth: 1.5, height: 1.5 },
  { x: 5.5, z: 3.5, width: 2, depth: 4, height: 2.2 },
  { x: -8.5, z: 4.5, width: 3, depth: 2, height: 1.2 },
];

export class GameScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 100 );
  private readonly player: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  private readonly orbs: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardNodeMaterial>[] = [];
  private readonly cameraTarget = new THREE.Vector3();

  constructor( state: GameState ) {
    this.scene.background = new THREE.Color( 0x08111f );
    this.scene.fog = new THREE.Fog( 0x08111f, 18, 42 );
    this.camera.position.set( 0, 8, 13 );
    this.addLights();
    this.addArena();
    this.player = this.addPlayer();
    this.addOrbs( state );
    this.sync( state, true );
  }

  resize( width: number, height: number ): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  sync( state: GameState, snapCamera = false ): void {
    this.player.position.set( state.player.x, 0.75, state.player.z );
    state.orbs.forEach( ( orb, index ) => {
      this.orbs[ index ].visible = !orb.collected;
      this.orbs[ index ].rotation.y += 0.03;
    } );

    const desiredCamera = new THREE.Vector3( state.player.x, 8, state.player.z + 12 );
    const desiredTarget = new THREE.Vector3( state.player.x, 0.4, state.player.z - 1.5 );
    if ( snapCamera ) {
      this.camera.position.copy( desiredCamera );
      this.cameraTarget.copy( desiredTarget );
    } else {
      this.camera.position.lerp( desiredCamera, 0.09 );
      this.cameraTarget.lerp( desiredTarget, 0.12 );
    }
    this.camera.lookAt( this.cameraTarget );
  }

  private addLights(): void {
    this.scene.add( new THREE.HemisphereLight( 0x9ed6ff, 0x1b2840, 2.2 ) );
    const keyLight = new THREE.DirectionalLight( 0xffffff, 2.6 );
    keyLight.position.set( 8, 12, 6 );
    this.scene.add( keyLight );
    const fillLight = new THREE.PointLight( 0x2a7fff, 35, 28, 2 );
    fillLight.position.set( -5, 4, -4 );
    this.scene.add( fillLight );
  }

  private addArena(): void {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry( 15.5, 64 ),
      new THREE.MeshStandardMaterial( { color: 0x17243a, roughness: 0.82, metalness: 0.08 } ),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add( ground );

    const edge = new THREE.Mesh(
      new THREE.RingGeometry( 15.15, 15.45, 64 ),
      new THREE.MeshBasicMaterial( { color: 0x4aa8d7, transparent: true, opacity: 0.65 } ),
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.01;
    this.scene.add( edge );

    const obstacleMaterial = new THREE.MeshStandardMaterial( { color: 0x354866, roughness: 0.5, metalness: 0.24 } );
    for ( const obstacle of OBSTACLES ) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry( obstacle.width, obstacle.height, obstacle.depth ),
        obstacleMaterial,
      );
      mesh.position.set( obstacle.x, obstacle.height / 2, obstacle.z );
      this.scene.add( mesh );
    }
  }

  private addPlayer(): THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> {
    const player = new THREE.Mesh(
      new THREE.SphereGeometry( 0.72, 32, 20 ),
      new THREE.MeshStandardMaterial( { color: 0xffbd5c, roughness: 0.28, metalness: 0.18, emissive: 0x542600 } ),
    );
    this.scene.add( player );
    return player;
  }

  private addOrbs( state: GameState ): void {
    for ( const orb of state.orbs ) {
      const mesh = new THREE.Mesh( new THREE.SphereGeometry( 0.48, 32, 20 ), createOrbMaterial( orb.id * 0.7 ) );
      mesh.position.set( orb.position.x, 1.1, orb.position.z );
      this.scene.add( mesh );
      this.orbs.push( mesh );
    }
  }
}
