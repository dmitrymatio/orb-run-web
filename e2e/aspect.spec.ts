import { expect, test } from '@playwright/test';

test.use( { viewport: { width: 1280, height: 720 } } );

test( 'initial player sphere is round at a non-square viewport', async ( { page }, testInfo ) => {
	const forceWebGL = testInfo.project.name === 'chromium-forced-webgl-headless';
	test.skip( !forceWebGL && testInfo.project.name !== 'edge-headed-real-gpu', 'The projection regression is covered by forced WebGL2 and headed Edge.' );
	await page.goto( forceWebGL ? '/?backend=webgl' : '/' );
	await expect( page.locator( '#backend' ) ).toHaveText( forceWebGL ? 'Backend: WebGL2' : 'Backend: WebGPU' );
	await page.waitForTimeout( 500 );
	const screenshot = await page.locator( 'canvas' ).screenshot( { path: testInfo.outputPath( 'initial-sphere.png' ) } );
	const bounds = await page.evaluate( async ( encoded ) => {
		const image = new Image();
		image.src = `data:image/png;base64,${ encoded }`;
		await image.decode();
		const canvas = document.createElement( 'canvas' );
		canvas.width = image.width;
		canvas.height = image.height;
		const context = canvas.getContext( '2d' );
		if ( !context ) throw new Error( 'Could not sample the rendered canvas screenshot.' );
		context.drawImage( image, 0, 0 );
		const data = context.getImageData( 0, 0, canvas.width, canvas.height ).data;
		let xMin = Infinity;
		let yMin = Infinity;
		let xMax = -1;
		let yMax = -1;
		let count = 0;
		for ( let y = Math.floor( canvas.height * 0.45 ); y < canvas.height * 0.61; y++ ) {
			for ( let x = Math.floor( canvas.width * 0.42 ); x < canvas.width * 0.58; x++ ) {
				const index = ( y * canvas.width + x ) * 4;
				if ( data[ index ] > 220 && data[ index ] > data[ index + 1 ] * 1.04 && data[ index ] > data[ index + 2 ] * 1.2 && data[ index + 1 ] > 180 ) {
					xMin = Math.min( xMin, x );
					yMin = Math.min( yMin, y );
					xMax = Math.max( xMax, x );
					yMax = Math.max( yMax, y );
					count++;
				}
			}
		}
		return { width: xMax - xMin + 1, height: yMax - yMin + 1, count };
	}, screenshot.toString( 'base64' ) );

	expect( bounds.count, JSON.stringify( bounds ) ).toBeGreaterThan( 100 );
	expect( Math.abs( bounds.width / bounds.height - 1 ), JSON.stringify( bounds ) ).toBeLessThan( 0.12 );
} );
