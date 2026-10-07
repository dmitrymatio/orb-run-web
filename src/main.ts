import './style.css';
import * as THREE from 'three/webgpu';
import { createGame, collectedOrbCount, formatElapsedTime, restartGame, stepGame, teleportPlayer, type GameState } from './game/game';
import { KeyboardInput } from './input/keyboard';
import { GameScene } from './render/gameScene';
import { createRenderer } from './render/renderer';

declare global {
  interface Window {
    __orbRun?: Readonly<{
      readonly state: GameState;
      teleport: ( x: number, z: number ) => void;
    }>;
  }
}

const appElement = document.querySelector<HTMLDivElement>( '#app' );
if ( !appElement ) throw new Error( 'The #app element is required.' );
const app = appElement;

app.innerHTML = `
  <div id="hud" aria-live="polite">
    <div id="title">ORB RUN</div>
    <div id="orb-count">Orbs 0/10</div>
    <div id="timer">0.0s</div>
    <div id="backend">Backend: Starting…</div>
  </div>
  <div id="win-message" hidden>
    <strong id="win-title">You win!</strong>
    <span id="win-summary"></span>
    <span>Press R to restart</span>
  </div>
`;

const orbCountElement = requireElement( 'orb-count' );
const timerElement = requireElement( 'timer' );
const backendElement = requireElement( 'backend' );
const winMessageElement = requireElement( 'win-message' );
const winSummaryElement = requireElement( 'win-summary' );
let state = createGame();
const input = new KeyboardInput();

void start();

async function start(): Promise<void> {
  const gameScene = new GameScene( state );
  const forceWebGL = new URLSearchParams( window.location.search ).get( 'backend' ) === 'webgl';
  const rendererBundle = await createRenderer( app, gameScene, forceWebGL );
  const timer = new THREE.Timer();
  timer.connect( document );
  backendElement.textContent = `Backend: ${ rendererBundle.backend }`;

  const resize = (): void => {
    rendererBundle.renderer.setSize( window.innerWidth, window.innerHeight );
    gameScene.resize( window.innerWidth, window.innerHeight );
  };
  window.addEventListener( 'resize', resize );
  resize();
  window.addEventListener( 'keydown', ( event ) => {
    if ( event.code === 'KeyR' && state.won ) {
      state = restartGame();
      gameScene.sync( state, true );
      updateHud();
    }
  } );

  if ( import.meta.env.DEV ) {
    Object.defineProperty( window, '__orbRun', {
      configurable: true,
      value: {
        get state(): GameState { return state; },
        teleport( x: number, z: number ): void {
          state = teleportPlayer( state, x, z );
          gameScene.sync( state, true );
          updateHud();
        },
      },
    } );
  }

  const frame = ( timestamp: number ): void => {
    timer.update( timestamp );
    const axes = input.getAxes();
    const forward = gameScene.camera.getWorldDirection( new THREE.Vector3() );
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors( forward, gameScene.camera.up ).normalize();
    state = stepGame(
      state,
      { x: right.x * axes.right + forward.x * axes.forward, z: right.z * axes.right + forward.z * axes.forward },
      timer.getDelta(),
    );
    gameScene.sync( state );
    updateHud();
    rendererBundle.renderPipeline.render();
    window.requestAnimationFrame( frame );
  };

  updateHud();
  window.requestAnimationFrame( frame );

  function updateHud(): void {
    const count = collectedOrbCount( state );
    orbCountElement.textContent = `Orbs ${ count }/10`;
    timerElement.textContent = formatElapsedTime( state.elapsedSeconds );
    winMessageElement.hidden = !state.won;
    winSummaryElement.textContent = state.won ? `10/10 in ${ formatElapsedTime( state.elapsedSeconds ) }` : '';
  }
}

function requireElement( id: string ): HTMLElement {
  const element = document.getElementById( id );
  if ( !element ) throw new Error( `#${ id } is required.` );
  return element;
}
