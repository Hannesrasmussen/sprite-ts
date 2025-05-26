# Sprite-TS

A super lightweight, tree-shakeable TypeScript library for creating animated sprites from spritesheets. Perfect for games, interactive applications, and any project that needs efficient sprite animations.

## Features

- **Fully Tree-Shakeable** - Import only what you need.
- **Zero Dependencies** - Lightweight and fast.
- **Flexible API** - Simple and intuitive sprite creation.
- **Auto Grid Detection** - Automatically calculates spritesheet dimensions.
- **Performance Optimized** - Efficient DOM manipulation and memory usage.
- **Framework Agnostic** - Works with any framework or vanilla JS.

## Installation

```bash
npm install sprite-ts
# or
pnpm add sprite-ts
```

## Quick Start

```typescript
import {
  createSprite,
  addSheet,
  addAnimation,
  play,
  appendTo,
} from 'sprite-ts';

// Create sprite with dimensions.
const sprite = createSprite({
  name: 'player',
  width: 32,
  height: 32, // Sprite element dimensions
});

// Add spritesheets as needed (async).
await addSheet(sprite, '/sprites/player.png');

// Create animations.
addAnimation(sprite, {
  name: 'walk',
  start: 0,
  end: 3,
  speed: 200,
  loop: true,
});

// Play and display.
play(sprite, 'walk');
appendTo(sprite, document.body);
```

## Auto Grid Detection

The library automatically calculates spritesheet grid dimensions based on your sprite size:

```typescript
// If your image is 256x128 pixels and sprite is 32x32:
// Grid is automatically detected as 8 columns × 4 rows = 32 total frames.
const sprite = createSprite({
  name: 'character',
  width: 32, // Sprite element width
  height: 32, // Sprite element height
});

await addSheet(sprite, '/sprites/character_256x128.png');
// Library automatically creates 32 frames (0-31).
```

## Tree-Shaking Benefits

Import only the functions you need for optimal bundle size:

```typescript
// Minimal import for static sprites (~2KB).
import { createSprite, addSheet, setFrame } from 'sprite-ts';

// Animation-focused import (~6KB).
import { createSprite, addSheet, addAnimation, play } from 'sprite-ts';

// Full feature set (~10KB).
import {
  createSprite,
  addSheet,
  addAnimation,
  play,
  stop,
  setFrame,
  appendTo,
  destroy,
} from 'sprite-ts';
```

## API Reference

### Core Functions

#### `createSprite(options: SpriteOptions): Sprite | null`

Creates a new sprite synchronously. Spritesheets are added separately.

```typescript
const sprite = createSprite({
  name: 'character', // string - unique identifier
  width: 64, // Width of sprite element
  height: 48, // Height of sprite element
  help: true, // Enable debug logging (optional)
});
```

### Spritesheet Functions

#### `addSheet(sprite, url, options?): Promise<string | null>`

Adds a spritesheet with automatic grid detection.

```typescript
// Auto-detect based on sprite's dimensions.
const sheetId = await addSheet(sprite, '/sprites/player.png');

// Override cell dimensions for this sheet.
const sheetId = await addSheet(sprite, '/sprites/ui.png', {
  cellWidth: 16,
  cellHeight: 16,
});

// Manual grid specification (bypass auto-detection).
const sheetId = await addSheet(sprite, '/sprites/custom.png', {
  columns: 8,
  rows: 4,
});
```

#### `removeSheet(sprite, id): boolean`

Removes a spritesheet by ID.

#### `getSheet(sprite, id?): SpriteSheet | undefined`

Gets a spritesheet by ID (or current one if no ID provided).

#### `getSheets(sprite): readonly SpriteSheet[]`

Gets all spritesheets.

#### `hasSheet(sprite, id?): boolean`

Checks if a spritesheet exists.

### Animation Functions

#### `addAnimation(sprite, animation): boolean`

Adds an animation. Supports two approaches:

**Sequential frames** (good for linear animations):

```typescript
addAnimation(sprite, {
  name: 'walk',
  start: 0, // Start frame.
  end: 7, // End frame.
  speed: 150, // Milliseconds per frame.
  loop: true, // Loop the animation.
});
```

**Custom frame arrays** (good for complex sequences):

```typescript
addAnimation(sprite, {
  name: 'attack',
  frames: [8, 9, 10, 9, 8], // Custom sequence.
  speed: 100,
  loop: false,
});
```

#### `play(sprite, name, loop?): boolean`

Plays an animation.

```typescript
play(sprite, 'walk'); // Use animation's default loop setting.
play(sprite, 'attack', false); // Override loop setting.
```

#### `stop(sprite, name?): void`

Stops an animation (or all animations if no name provided).

### Frame Functions

#### `setFrame(sprite, index, spritesheetId?): boolean`

Sets a specific frame.

```typescript
setFrame(sprite, 5); // Frame 5 of current sheet.
setFrame(sprite, 2, 'specific-sheet'); // Frame 2 of specific sheet.
```

#### `getCurrentFrame(sprite): number | undefined`

Gets the current frame index.

#### `getCurrentSheet(sprite): string | undefined`

Gets the current spritesheet ID.

### DOM Functions

#### `appendTo(sprite, parent): boolean`

Appends the sprite to a DOM element.

```typescript
appendTo(sprite, document.getElementById('game-container'));
```

**Styling sprites:**

```typescript
// The library handles sprite functionality, you handle presentation.
sprite.element.style.left = '100px';
sprite.element.style.top = '50px';
sprite.element.style.transform = 'scale(2)'; // 2x size.
sprite.element.classList.add('player-sprite');
```

### Utility Functions

#### `getMemory(sprite): SpriteMemory`

Gets sprite memory for analytics and debugging.

```typescript
const memory = getMemory(sprite);
console.log(`Played ${memory.playedAnimations.length} animations`);
```

#### `onEnd(sprite, name, callback): (() => void) | null`

Adds a callback for when an animation ends.

```typescript
const cleanup = onEnd(sprite, 'attack', () => {
  console.log('Attack finished!');
  play(sprite, 'idle'); // Return to idle.
});

// Call cleanup() to remove the callback.
if (cleanup) cleanup();
```

#### `destroy(sprite): void`

Cleans up the sprite and removes it from DOM.

## Usage Patterns

### Game Character

```typescript
import { createSprite, addSheet, addAnimation, play } from 'sprite-ts';

class Player {
  constructor() {
    // Sync creation - works in constructors.
    this.sprite = createSprite({
      name: 'player',
      width: 32,
      height: 32,
    });

    this.loadAssets();
  }

  async loadAssets() {
    await addSheet(this.sprite, '/sprites/player.png');

    addAnimation(this.sprite, { name: 'idle', start: 0, end: 3, loop: true });
    addAnimation(this.sprite, { name: 'walk', start: 4, end: 7, loop: true });

    play(this.sprite, 'idle');
  }
}
```

### Multiple Spritesheets

```typescript
const character = createSprite({
  name: 'hero',
  width: 64,
  height: 64,
});

// Each spritesheet gets a unique ID for animations.
const idleSheetId = await addSheet(character, '/sprites/hero_idle.png');
const walkSheetId = await addSheet(character, '/sprites/hero_walk.png');

addAnimation(character, {
  name: 'idle',
  start: 0,
  end: 5,
  spritesheet: idleSheetId, // Use specific sheet.
});

addAnimation(character, {
  name: 'walk',
  start: 0,
  end: 7,
  spritesheet: walkSheetId,
});
```

### Static Icons/UI Elements

```typescript
import { createSprite, addSheet, setFrame } from 'sprite-ts';

// Perfect for non-animated sprites.
const healthIcon = createSprite({ name: 'health', width: 16, height: 16 });
await addSheet(healthIcon, '/sprites/ui_icons.png');
setFrame(healthIcon, 3); // Show health icon frame.

appendTo(healthIcon, document.querySelector('.ui-health'));
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { Sprite, SpriteOptions, SpriteAnimation } from 'sprite-ts';

const options: SpriteOptions = {
  name: 'player',
  width: 32,
  height: 32,
  help: true,
};

const sprite: Sprite = createSprite(options);
```

## Migration Guide

**From other sprite libraries:**

Most sprite libraries require manual grid specification. Sprite-TS automatically detects your grid:

```typescript
// Other libraries.
createSprite({
  url: '/sprite.png',
  frameWidth: 32,
  frameHeight: 32,
  frames: 16, // Manual calculation.
  columns: 4, // Manual calculation.
  rows: 4, // Manual calculation.
});

// Sprite-TS.
createSprite({
  name: 'sprite',
  width: 32,
  height: 32, // Grid auto-detected from image dimensions.
});
```

## Development

### Workflow

#### Make changes

```bash
git add . && git commit -m "fix: some bug"
```

#### Bump version

```bash
npm version patch # or minor/major
```

#### Push and relax!

```bash
git push sprite-ts main
```

### Testing

This project uses [Vitest](https://vitest.dev/) for testing.

#### Running Tests

```bash
# Run tests once
pnpm test:run

# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Building

```bash
pnpm build
```

### Development Mode

```bash
pnpm dev
```
