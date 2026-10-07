import { expect, test, type Page, type TestInfo } from '@playwright/test';

type HookState = {
	player: { x: number; z: number };
	orbs: { id: number; position: { x: number; z: number }; collected: boolean }[];
	elapsedSeconds: number;
	won: boolean;
};

type OrbRunHook = {
	readonly state: HookState;
	teleport: ( x: number, z: number ) => void;
};

declare global {
	interface Window {
		__orbRun?: OrbRunHook;
	}
}

async function openGame( page: Page, testInfo: TestInfo, consoleErrors: string[] ): Promise<void> {
	page.on( 'console', ( message ) => {
		if ( message.type() === 'error' ) consoleErrors.push( message.text() );
	} );
	page.on( 'pageerror', ( error ) => consoleErrors.push( error.message ) );
	const query = testInfo.project.name === 'chromium-forced-webgl-headless' ? '?backend=webgl' : '';
	await page.goto( `/${ query }` );
	await expect( page.locator( '#backend' ) ).toContainText( /Backend: (WebGPU|WebGL2)/ );
	await expect.poll( () => page.evaluate( () => Boolean( window.__orbRun ) ) ).toBe( true );
}

async function readHookState( page: Page ): Promise<HookState> {
	return page.evaluate( () => {
		if ( !window.__orbRun ) throw new Error( 'The dev test hook is not available.' );
		return structuredClone( window.__orbRun.state );
	} );
}

async function teleportTo( page: Page, x: number, z: number ): Promise<void> {
	await page.evaluate( ( position ) => {
		if ( !window.__orbRun ) throw new Error( 'The dev test hook is not available.' );
		window.__orbRun.teleport( position.x, position.z );
	}, { x, z } );
}

test( 'loads, renders visible pixels, labels the backend, moves, collects, wins and restarts', async ( { page }, testInfo ) => {
	const consoleErrors: string[] = [];
	await openGame( page, testInfo, consoleErrors );
	const backendText = await page.locator( '#backend' ).innerText();
	if ( testInfo.project.name === 'chromium-forced-webgl-headless' ) {
		expect( backendText ).toBe( 'Backend: WebGL2' );
	}
	if ( testInfo.project.name === 'edge-headed-real-gpu' ) {
		expect( backendText ).toBe( 'Backend: WebGPU' );
	}

	const canvas = page.locator( 'canvas' );
	await expect( canvas ).toBeVisible();
	const canvasScreenshot = await canvas.screenshot( { path: testInfo.outputPath( 'orb-run.png' ) } );
	const nonBlankPixels = await page.evaluate( async ( encoded ) => {
		const image = new Image();
		image.src = `data:image/png;base64,${ encoded }`;
		await image.decode();
		const sample = document.createElement( 'canvas' );
		sample.width = image.width;
		sample.height = image.height;
		const context = sample.getContext( '2d' );
		if ( !context ) throw new Error( 'Could not sample the rendered canvas screenshot.' );
		context.drawImage( image, 0, 0 );
		const pixels = context.getImageData( 0, 0, sample.width, sample.height ).data;
		let visible = 0;
		for ( let index = 3; index < pixels.length; index += 4 ) {
			if ( pixels[ index ] !== 0 && ( pixels[ index - 1 ] !== 0 || pixels[ index - 2 ] !== 0 || pixels[ index - 3 ] !== 0 ) ) visible++;
		}
		return visible;
	}, canvasScreenshot.toString( 'base64' ) );
	expect( nonBlankPixels, 'canvas screenshot should contain non-black rendered pixels' ).toBeGreaterThan( 100 );
	await page.screenshot( { path: testInfo.outputPath( 'orb-run-page.png' ) } );

	const initial = await readHookState( page );
	await page.keyboard.down( 'ArrowUp' );
	await page.waitForTimeout( 350 );
	await page.keyboard.up( 'ArrowUp' );
	await expect.poll( async () => {
		const moved = await readHookState( page );
		return Math.hypot( moved.player.x - initial.player.x, moved.player.z - initial.player.z );
	} ).toBeGreaterThan( 0.1 );

	const firstOrb = initial.orbs[ 0 ];
	if ( !firstOrb ) throw new Error( 'Expected the first orb.' );
	await teleportTo( page, firstOrb.position.x, firstOrb.position.z );
	await expect( page.locator( '#orb-count' ) ).toHaveText( 'Orbs 1/10' );
	await teleportTo( page, firstOrb.position.x, firstOrb.position.z );
	await expect( page.locator( '#orb-count' ) ).toHaveText( 'Orbs 1/10' );

	for ( const orb of initial.orbs.slice( 1 ) ) {
		await teleportTo( page, orb.position.x, orb.position.z );
	}
	await expect( page.locator( '#orb-count' ) ).toHaveText( 'Orbs 10/10' );
	await expect( page.locator( '#win-message' ) ).toBeVisible();
	await expect( page.locator( '#win-message' ) ).toContainText( 'You win!' );
	await expect( page.locator( '#win-message' ) ).toContainText( 'Press R to restart' );

	const wonTime = ( await readHookState( page ) ).elapsedSeconds;
	await page.waitForTimeout( 250 );
	expect( ( await readHookState( page ) ).elapsedSeconds ).toBe( wonTime );
	await page.keyboard.press( 'r' );
	await expect( page.locator( '#orb-count' ) ).toHaveText( 'Orbs 0/10' );
	await expect( page.locator( '#win-message' ) ).toBeHidden();
	const restarted = await readHookState( page );
	expect( restarted.elapsedSeconds ).toBe( 0 );
	expect( restarted.orbs.every( ( orb ) => !orb.collected ) ).toBe( true );
	expect( restarted.orbs.map( ( orb ) => orb.position ) ).toEqual( initial.orbs.map( ( orb ) => orb.position ) );

	expect( consoleErrors, 'page should emit no console or uncaught errors' ).toEqual( [] );
} );
