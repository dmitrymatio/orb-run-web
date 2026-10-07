export type InputAxes = Readonly<{ right: number; forward: number }>;

const CONTROL_KEYS = new Set( [ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD' ] );

export class KeyboardInput {
  private readonly pressed = new Set<string>();

  constructor( private readonly target: Window = window ) {
    target.addEventListener( 'keydown', this.onKeyDown );
    target.addEventListener( 'keyup', this.onKeyUp );
    target.addEventListener( 'blur', this.clear );
  }

  getAxes(): InputAxes {
    const right = this.isDown( 'KeyD', 'ArrowRight' ) ? 1 : this.isDown( 'KeyA', 'ArrowLeft' ) ? -1 : 0;
    const forward = this.isDown( 'KeyW', 'ArrowUp' ) ? 1 : this.isDown( 'KeyS', 'ArrowDown' ) ? -1 : 0;
    return { right, forward };
  }

  dispose(): void {
    this.target.removeEventListener( 'keydown', this.onKeyDown );
    this.target.removeEventListener( 'keyup', this.onKeyUp );
    this.target.removeEventListener( 'blur', this.clear );
    this.clear();
  }

  private readonly onKeyDown = ( event: KeyboardEvent ): void => {
    if ( CONTROL_KEYS.has( event.code ) ) event.preventDefault();
    this.pressed.add( event.code );
  };

  private readonly onKeyUp = ( event: KeyboardEvent ): void => {
    if ( CONTROL_KEYS.has( event.code ) ) event.preventDefault();
    this.pressed.delete( event.code );
  };

  private readonly clear = (): void => { this.pressed.clear(); };

  private isDown( ...keys: string[] ): boolean {
    return keys.some( ( key ) => this.pressed.has( key ) );
  }
}
