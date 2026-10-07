export type Vec2 = Readonly<{ x: number; z: number }>;

export type OrbState = Readonly<{
  id: number;
  position: Vec2;
  collected: boolean;
}>;

export type GameState = Readonly<{
  player: Vec2;
  orbs: readonly OrbState[];
  elapsedSeconds: number;
  won: boolean;
}>;

export type MovementInput = Readonly<{
  x: number;
  z: number;
}>;

export const TOTAL_ORBS = 10;
export const ARENA_RADIUS = 15;
export const PLAYER_SPEED = 8;
export const COLLECTION_DISTANCE = 1.45;

const INITIAL_ORB_POSITIONS: readonly Vec2[] = [
  { x: -10, z: -9 }, { x: -5, z: -4 }, { x: 1, z: -10 }, { x: 8, z: -7 }, { x: 11, z: -1 },
  { x: 7, z: 6 }, { x: 1, z: 9 }, { x: -7, z: 8 }, { x: -11, z: 2 }, { x: -2, z: 2 },
];

export function createGame(): GameState {
  return {
    player: { x: 0, z: 5 },
    orbs: INITIAL_ORB_POSITIONS.map( ( position, id ) => ( { id, position: { ...position }, collected: false } ) ),
    elapsedSeconds: 0,
    won: false,
  };
}

export function collectedOrbCount( state: GameState ): number {
  return state.orbs.filter( ( orb ) => orb.collected ).length;
}

export function stepGame( state: GameState, input: MovementInput, deltaSeconds: number ): GameState {
  if ( state.won ) return state;

  const safeDelta = Math.min( Math.max( deltaSeconds, 0 ), 0.1 );
  const length = Math.hypot( input.x, input.z );
  const scale = length > 1 ? 1 / length : 1;
  const nextPlayer = clampToArena( {
    x: state.player.x + input.x * scale * PLAYER_SPEED * safeDelta,
    z: state.player.z + input.z * scale * PLAYER_SPEED * safeDelta,
  } );

  return collectAtPosition( { ...state, player: nextPlayer, elapsedSeconds: state.elapsedSeconds + safeDelta } );
}

export function teleportPlayer( state: GameState, x: number, z: number ): GameState {
  if ( state.won ) return state;
  return collectAtPosition( { ...state, player: clampToArena( { x, z } ) } );
}

export function restartGame(): GameState {
  return createGame();
}

export function formatElapsedTime( elapsedSeconds: number ): string {
  return `${ elapsedSeconds.toFixed( 1 ) }s`;
}

function collectAtPosition( state: GameState ): GameState {
  const orbs = state.orbs.map( ( orb ) => {
    if ( orb.collected || distance( state.player, orb.position ) > COLLECTION_DISTANCE ) return orb;
    return { ...orb, collected: true };
  } );
  const won = collectedOrbCount( { ...state, orbs } ) === TOTAL_ORBS;
  return { ...state, orbs, won };
}

function clampToArena( position: Vec2 ): Vec2 {
  const distanceFromCenter = Math.hypot( position.x, position.z );
  if ( distanceFromCenter <= ARENA_RADIUS ) return position;
  const scale = ARENA_RADIUS / distanceFromCenter;
  return { x: position.x * scale, z: position.z * scale };
}

function distance( a: Vec2, b: Vec2 ): number {
  return Math.hypot( a.x - b.x, a.z - b.z );
}
