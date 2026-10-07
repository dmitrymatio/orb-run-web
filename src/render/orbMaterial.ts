import * as THREE from 'three/webgpu';
import { color, dot, normalView, oneMinus, positionViewDirection, sin, time } from 'three/tsl';

export function createOrbMaterial( phase: number ): THREE.MeshStandardNodeMaterial {
  const material = new THREE.MeshStandardNodeMaterial( { metalness: 0.05, roughness: 0.24 } );
  const pulse = sin( time.mul( 3 ).add( phase ) ).mul( 0.3 ).add( 1.35 );
  // A Fresnel rim brightens the edge where the surface turns away from the camera.
  const rim = oneMinus( dot( normalView, positionViewDirection ).abs() ).pow( 2 ).mul( 0.85 );

  material.colorNode = color( 0x5ed7ff );
  material.emissiveNode = color( 0x2d8cff ).mul( pulse.add( rim ) );
  return material;
}
