import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.ORB_RUN_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig( {
	testDir: './e2e',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: true,
	retries: 0,
	reporter: 'list',
	outputDir: 'test-results',
	use: {
		baseURL,
		viewport: { width: 1280, height: 800 },
		trace: 'retain-on-failure',
	},
	projects: [
		{
			name: 'chromium-default-headless',
			testIgnore: [ '**/production.spec.ts', '**/aspect.spec.ts' ],
			use: { ...devices[ 'Desktop Chrome' ], headless: true },
		},
		{
			name: 'chromium-forced-webgl-headless',
			testIgnore: [ '**/production.spec.ts', '**/aspect.spec.ts' ],
			use: { ...devices[ 'Desktop Chrome' ], headless: true },
		},
		{
			name: 'edge-headed-real-gpu',
			testMatch: '**/*.spec.ts',
			testIgnore: '**/production.spec.ts',
			use: { ...devices[ 'Desktop Edge' ], channel: 'msedge', headless: false },
		},
		{
			name: 'production-preview',
			testMatch: '**/production.spec.ts',
			use: {
				...devices[ 'Desktop Chrome' ],
				headless: true,
				baseURL: process.env.ORB_RUN_PREVIEW_URL ?? 'http://127.0.0.1:4173',
			},
		},
	],
} );
