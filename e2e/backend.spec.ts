import { expect, test } from '@playwright/test';

declare global {
	interface Window {
		__orbRunTestAdapterRequests?: number;
	}
}

test( 'default URL falls back to WebGL2 when the WebGPU adapter is unavailable', async ( { page }, testInfo ) => {
	test.skip( testInfo.project.name !== 'chromium-default-headless', 'This fallback test targets the default headless Chromium project.' );
	await page.addInitScript( () => {
		window.__orbRunTestAdapterRequests = 0;
		Object.defineProperty( navigator, 'gpu', {
			configurable: true,
			value: {
				requestAdapter: async () => {
					window.__orbRunTestAdapterRequests = ( window.__orbRunTestAdapterRequests ?? 0 ) + 1;
					return null;
				},
			},
		} );
	} );
	await page.goto( '/' );
	await expect( page.locator( '#backend' ) ).toHaveText( 'Backend: WebGL2' );
	expect( await page.evaluate( () => window.__orbRunTestAdapterRequests ) ).toBeGreaterThan( 0 );
} );
