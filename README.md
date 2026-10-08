# Orb Run Web

A tiny third-person collectathon built with three.js r186, Vite, and TypeScript. Collect all ten glowing orbs, then press **R** to play again.

## Run it

```powershell
npm ci
npm run dev
```

Open the local address Vite prints. Add `?backend=webgl` to force the WebGL2 fallback. Use **WASD** or the **arrow keys** to move relative to the follow camera; use **R** after winning to restart.

## Useful commands

```powershell
npm run typecheck
npm test
npm run build
npm run preview
npm run test:e2e
```

[![CI](https://github.com/dmitrymatio/orb-run-web/actions/workflows/ci.yml/badge.svg)](https://github.com/dmitrymatio/orb-run-web/actions/workflows/ci.yml) CI runs typechecking, unit tests, the production build, and headless Chromium browser checks; `npm run test:e2e:edge` remains a local real-GPU Edge check.

## Where the pieces live

- `src/game/` is the pure, framework-free game state: movement, collection, the timer, win state, and restart.
- `src/input/` translates keyboard presses into movement axes.
- `src/render/` creates the three.js scene, TSL material, post-processing, and renderer.
- `src/main.ts` wires those layers together and owns the one animation loop.

## Three.js terms

**WebGPU** is the newer browser graphics API. `WebGPURenderer` uses it when available and automatically falls back to WebGL2; `?backend=webgl` makes that fallback explicit.

**TSL** (Three Shading Language) is three.js’s node-based way to describe material math. The orb’s pulse and rim glow are small TSL expressions rather than handwritten shader strings.

**RenderPipeline** is the WebGPU renderer’s post-processing chain. Here it combines the scene image with a bloom pass so bright orbs softly glow.
