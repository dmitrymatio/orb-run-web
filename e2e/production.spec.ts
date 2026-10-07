import { expect, test } from '@playwright/test';

test( 'production build does not expose the dev test hook', async ( { page } ) => {
	await page.goto( '/' );
	await expect( page.locator( '#backend' ) ).toContainText( /Backend: (WebGPU|WebGL2)/ );
	expect( await page.evaluate( () => '__orbRun' in window ) ).toBe( false );
} );
