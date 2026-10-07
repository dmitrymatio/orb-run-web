import { describe, expect, it } from 'vitest';
import { collectedOrbCount, createGame, restartGame, stepGame, teleportPlayer, type GameState } from './game';

function collectEveryOrbExceptLast(): GameState {
	let state = createGame();
	for ( const orb of state.orbs.slice( 0, -1 ) ) {
		state = teleportPlayer( state, orb.position.x, orb.position.z );
	}
	return state;
}

describe( 'orb collection', () => {
	it( 'collects each orb once, even when the player remains on it', () => {
		const orb = createGame().orbs[ 0 ];
		if ( !orb ) throw new Error( 'Expected an initial orb.' );

		const once = teleportPlayer( createGame(), orb.position.x, orb.position.z );
		const twice = teleportPlayer( once, orb.position.x, orb.position.z );

		expect( collectedOrbCount( once ) ).toBe( 1 );
		expect( collectedOrbCount( twice ) ).toBe( 1 );
		expect( twice.orbs.filter( ( item ) => item.collected ).map( ( item ) => item.id ) ).toEqual( [ orb.id ] );
	} );

	it( 'wins exactly when the tenth orb is collected', () => {
		const beforeLast = collectEveryOrbExceptLast();
		const lastOrb = beforeLast.orbs.find( ( orb ) => !orb.collected );
		if ( !lastOrb ) throw new Error( 'Expected one uncollected orb.' );

		expect( collectedOrbCount( beforeLast ) ).toBe( 9 );
		expect( beforeLast.won ).toBe( false );

		const won = teleportPlayer( beforeLast, lastOrb.position.x, lastOrb.position.z );
		expect( collectedOrbCount( won ) ).toBe( 10 );
		expect( won.won ).toBe( true );
	} );

	it( 'stops the timer once the player has won', () => {
		const beforeLast = collectEveryOrbExceptLast();
		const lastOrb = beforeLast.orbs.find( ( orb ) => !orb.collected );
		if ( !lastOrb ) throw new Error( 'Expected one uncollected orb.' );
		const won = teleportPlayer( beforeLast, lastOrb.position.x, lastOrb.position.z );

		expect( stepGame( won, { x: 1, z: 0 }, 0.1 ) ).toBe( won );
		expect( stepGame( won, { x: 0, z: 0 }, 1 ).elapsedSeconds ).toBe( won.elapsedSeconds );
	} );
} );

describe( 'restart', () => {
	it( 'resets the count, timer, player, win state and orb positions', () => {
		const beforeLast = collectEveryOrbExceptLast();
		const lastOrb = beforeLast.orbs.find( ( orb ) => !orb.collected );
		if ( !lastOrb ) throw new Error( 'Expected one uncollected orb.' );
		const won = teleportPlayer( beforeLast, lastOrb.position.x, lastOrb.position.z );
		const restarted = restartGame();

		expect( collectedOrbCount( won ) ).toBe( 10 );
		expect( restarted.won ).toBe( false );
		expect( collectedOrbCount( restarted ) ).toBe( 0 );
		expect( restarted.elapsedSeconds ).toBe( 0 );
		expect( restarted.player ).toEqual( { x: 0, z: 5 } );
		expect( restarted.orbs ).toEqual( createGame().orbs );
		expect( restarted.orbs.every( ( orb ) => !orb.collected ) ).toBe( true );
	} );
} );
