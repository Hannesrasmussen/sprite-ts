import {
  SpriteAnimationOptions,
  SpriteOptions,
  SpriteAnimation,
  SpriteSheet,
  SpriteMemory,
  Sprite,
} from '@/types';

/**
 * Creates a new sprite instance with the specified dimensions and properties.
 * @param options - Configuration options for the sprite.
 * @returns A new sprite object, or null if creation fails.
 * @example
 * ```typescript
 * const sprite = createSprite({
 *   name: 'player',
 *   width: 32,
 *   height: 32,
 *   help: true // Enable debug logging.
 * });
 * ```
 */
export function createSprite(options: SpriteOptions): Sprite | null {
  const { name, width, height, help = false } = options;

  if (!name || typeof name !== 'string') {
    logError(
      name || 'unknown',
      'createSprite',
      'Sprite name must be a non-empty string'
    );
    return null;
  }
  if (!width || width <= 0) {
    logError(name, 'createSprite', 'Sprite width must be a positive number');
    return null;
  }
  if (!height || height <= 0) {
    logError(name, 'createSprite', 'Sprite height must be a positive number');
    return null;
  }

  try {
    const element = createSpriteElement(name, width, height);

    const sprite: Sprite = {
      name,
      width,
      height,
      element,
      spritesheets: new Map(),
      animations: [],
      activeIntervals: new Map(),
      animationCallbacks: new Map(),
      memory: { playedAnimations: [] },
      currentFrame: undefined,
      currentSpritesheetId: undefined,
      lastPlayedAnimation: undefined,
      help,
    };

    if (help) {
      log(sprite, `Sprite created with ${width}\u00D7${height} dimensions`);
    }
    return sprite;
  } catch (error) {
    logError(name, 'createSprite', 'Failed to create DOM element', error);
    return null;
  }
}

/**
 * Creates the DOM element for the sprite with proper styling for pixel-perfect rendering.
 * @param name - The sprite name (used as element ID).
 * @param width - Width in pixels.
 * @param height - Height in pixels.
 * @returns Configured HTML div element.
 */
function createSpriteElement(
  name: string,
  width: number,
  height: number
): HTMLDivElement {
  const sprite = document.createElement('div');
  sprite.className = 'sprite';
  sprite.id = name;

  const styles: Partial<CSSStyleDeclaration> = {
    position: 'absolute',
    width: `${width}px`,
    height: `${height}px`,
    minWidth: `${width}px`,
    minHeight: `${height}px`,
    maxWidth: `${width}px`,
    maxHeight: `${height}px`,
    userSelect: 'none',
    pointerEvents: 'none',
    imageRendering: 'pixelated',
    backgroundRepeat: 'no-repeat',
  };

  Object.assign(sprite.style, styles);
  sprite.draggable = false;

  return sprite;
}

/**
 * Logs debug messages when help mode is enabled.
 * @param sprite - The sprite instance.
 * @param message - Message to log.
 */
function log(sprite: Sprite, message: string): void {
  if (sprite.help) {
    console.log(
      `%c[SPRITE:${sprite.name}] %c${message}`,
      'color: #4CAF50; font-weight: bold',
      'color: #81C784'
    );
  }
}

/**
 * Logs error messages with sprite context. Always logs regardless of help mode.
 * @param sprite - The sprite instance (or sprite name if sprite not available).
 * @param operation - The operation that failed.
 * @param message - Error message.
 * @param error - Optional original error.
 */
function logError(
  sprite: Sprite | string,
  operation: string,
  message: string,
  error?: unknown
): void {
  const spriteName = typeof sprite === 'object' ? sprite.name : sprite;
  console.error(
    `%c[SPRITE:${spriteName}:ERROR] %c${operation} failed: ${message}`,
    'color: #f44336; font-weight: bold',
    'color: #ff7043'
  );
  if (error) {
    console.error('Original error:', error);
  }
}

/**
 * Adds a spritesheet to the sprite with automatic grid detection.
 * @param sprite - The sprite instance.
 * @param url - URL of the spritesheet image.
 * @param options - Configuration options for the spritesheet.
 * @returns Promise that resolves to the spritesheet ID if successful, null if failed.
 * @example
 * ```typescript
 * // Auto-detect grid based on sprite dimensions.
 * const sheetId = await addSheet(sprite, '/sprites/player.png');
 *
 * // Specify custom grid.
 * const sheetId = await addSheet(sprite, '/sprites/enemies.png', {
 *   columns: 4,
 *   rows: 2,
 *   cellWidth: 64,
 *   cellHeight: 64
 * });
 * ```
 */
export async function addSheet(
  sprite: Sprite,
  url: string,
  options: {
    columns?: number;
    rows?: number;
    cellWidth?: number;
    cellHeight?: number;
    cellSize?: number;
    id?: string;
  } = {}
): Promise<string | null> {
  const {
    columns,
    rows,
    cellWidth,
    cellHeight,
    cellSize,
    id = `sheet_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  } = options;

  try {
    const dimensions = await getImageDimensions(url);

    const finalCellWidth = cellSize || cellWidth || sprite.width;
    const finalCellHeight = cellSize || cellHeight || sprite.height;

    const calculatedColumns =
      columns || Math.floor(dimensions.width / finalCellWidth);
    const calculatedRows =
      rows || Math.floor(dimensions.height / finalCellHeight);

    if (calculatedColumns <= 0 || calculatedRows <= 0) {
      logError(
        sprite,
        'addSheet',
        `Invalid grid calculation: ${calculatedColumns}\u00D7${calculatedRows}. Check cell dimensions vs image size (${dimensions.width}\u00D7${dimensions.height})`
      );
      return null;
    }

    const spritesheet: SpriteSheet = {
      spritesheet: url,
      columns: calculatedColumns,
      rows: calculatedRows,
      width: finalCellWidth,
      height: finalCellHeight,
      cells: [], // Will be populated by createSpriteCells
    };

    // Generate cells using the complete spritesheet object
    spritesheet.cells = createSpriteCells(spritesheet);

    sprite.spritesheets.set(id, spritesheet);

    if (!sprite.currentSpritesheetId) {
      sprite.currentSpritesheetId = id;
    }

    log(
      sprite,
      `Spritesheet added: ${calculatedColumns}\u00D7${calculatedRows} grid (${spritesheet.cells.length} cells) from ${dimensions.width}\u00D7${dimensions.height} image`
    );
    return id;
  } catch (error) {
    logError(sprite, 'addSheet', `Failed to load image: ${url}`, error);
    return null;
  }
}

/**
 * Removes a spritesheet from the sprite and updates current spritesheet if necessary.
 * @param sprite - The sprite instance.
 * @param id - ID of the spritesheet to remove.
 * @returns True if the spritesheet was removed, false if it didn't exist.
 */
export function removeSheet(sprite: Sprite, id: string): boolean {
  const removed = sprite.spritesheets.delete(id);
  if (removed) {
    log(sprite, `Spritesheet "${id}" removed`);

    if (sprite.currentSpritesheetId === id) {
      const nextId = sprite.spritesheets.keys().next().value;
      sprite.currentSpritesheetId = nextId || undefined;
    }
  }
  return removed;
}

/**
 * Retrieves a spritesheet by ID or returns the current/first available spritesheet.
 * @param sprite - The sprite instance.
 * @param id - Optional spritesheet ID. If not provided, returns current or first available.
 * @returns The spritesheet object or undefined if not found.
 */
export function getSheet(sprite: Sprite, id?: string): SpriteSheet | undefined {
  const targetId =
    id ||
    sprite.currentSpritesheetId ||
    sprite.spritesheets.keys().next().value;
  return targetId ? sprite.spritesheets.get(targetId) : undefined;
}

/**
 * Returns all spritesheets as a readonly array.
 * @param sprite - The sprite instance.
 * @returns Array of all spritesheet objects.
 */
export const getSheets = (sprite: Sprite): readonly SpriteSheet[] =>
  Array.from(sprite.spritesheets.values());

/**
 * Checks if a spritesheet exists.
 * @param sprite - The sprite instance.
 * @param id - Optional spritesheet ID. If not provided, checks if any spritesheets exist.
 * @returns True if the spritesheet exists.
 */
export const hasSheet = (sprite: Sprite, id?: string): boolean => {
  return id ? sprite.spritesheets.has(id) : sprite.spritesheets.size > 0;
};

/**
 * Adds an animation to the sprite. Supports two approaches:
 * 1. Sequential frames using start/end (good for spritesheets with linear animations)
 * 2. Custom frame arrays (good for complex animations that jump around the spritesheet)
 * @param sprite - The sprite instance.
 * @param animation - Animation configuration.
 * @returns True if animation was added successfully, false if failed.
 * @example
 * ```typescript
 * // Sequential animation (frames 0-7).
 * const success = addAnimation(sprite, {
 *   name: 'walk',
 *   start: 0,
 *   end: 7,
 *   speed: 150,
 *   loop: true
 * });
 *
 * // Custom frame sequence.
 * addAnimation(sprite, {
 *   name: 'attack',
 *   frames: [8, 9, 10, 9, 8],
 *   speed: 100
 * });
 * ```
 */
export function addAnimation(
  sprite: Sprite,
  animation: SpriteAnimationOptions
): boolean {
  const {
    name,
    start = 0,
    end,
    frames,
    speed = 100,
    loop = false,
    spritesheet,
  } = animation;

  if (sprite.animations.find((anim) => anim.name === name)) {
    logError(sprite, 'addAnimation', `Animation "${name}" already exists`);
    return false;
  }

  let animationFrames: number[];
  if (frames) {
    animationFrames = [...frames];
  } else if (end !== undefined) {
    animationFrames = Array.from(
      { length: end - start + 1 },
      (_, i) => start + i
    );
  } else {
    logError(
      sprite,
      'addAnimation',
      'Either "frames" or "end" must be specified'
    );
    return false;
  }

  // Validate frames against available spritesheets
  const targetSheet = spritesheet
    ? sprite.spritesheets.get(spritesheet)
    : getSheet(sprite);

  if (!targetSheet) {
    logError(
      sprite,
      'addAnimation',
      `No spritesheet available for animation "${name}"`
    );
    return false;
  }

  // Check if all frames are valid
  const maxFrame = targetSheet.cells.length - 1;
  const invalidFrames = animationFrames.filter(
    (frame) => frame < 0 || frame > maxFrame
  );
  if (invalidFrames.length > 0) {
    logError(
      sprite,
      'addAnimation',
      `Invalid frames [${invalidFrames.join(
        ', '
      )}] for animation "${name}". Sheet has ${
        targetSheet.cells.length
      } frames (0-${maxFrame})`
    );
    return false;
  }

  const newAnimation: SpriteAnimation = {
    name,
    start,
    end: end || start + animationFrames.length - 1,
    frames: animationFrames,
    speed,
    stopped: true,
    loop,
    ...(spritesheet && { spritesheet }),
  };

  sprite.animations.push(newAnimation);
  log(
    sprite,
    `Animation "${name}" added: frames ${newAnimation.start}-${newAnimation.end} at ${speed}ms`
  );
  return true;
}

/**
 * Plays an animation on the sprite. Automatically stops any existing animation with the same name.
 * @param sprite - The sprite instance.
 * @param animationName - Name of the animation to play.
 * @param loop - Override the animation's default loop setting.
 * @returns True if animation started successfully, false if failed.
 * @example
 * ```typescript
 * // Play with default loop setting.
 * const success = play(sprite, 'walk');
 *
 * // Force loop override.
 * play(sprite, 'idle', true);
 * ```
 */
export function play(
  sprite: Sprite,
  animationName: string | number,
  loop?: boolean
): boolean {
  const animation = sprite.animations.find(
    (anim) => anim.name === animationName
  );
  if (!animation) {
    logError(sprite, 'play', `Animation "${animationName}" not found`);
    return false;
  }

  const spritesheet = getSpriteSheetForAnimation(sprite, animation);
  if (!spritesheet) {
    logError(
      sprite,
      'play',
      `No spritesheet available for animation "${animationName}"`
    );
    return false;
  }

  stop(sprite, animationName);

  animation.stopped = false;
  const shouldLoop = loop !== undefined ? loop : animation.loop;
  let frameIndex = 0;
  sprite.lastPlayedAnimation = String(animationName);

  sprite.memory.playedAnimations.push({
    name: String(animationName),
    timestamp: Date.now(),
    length: 0,
    looped: shouldLoop,
  });

  log(sprite, `Playing animation "${animationName}" (loop: ${shouldLoop})`);

  const intervalId = window.setInterval(() => {
    const currentFrameNumber = animation.frames[frameIndex];

    if (!validateFrameIndex(currentFrameNumber, spritesheet)) {
      logError(
        sprite,
        'play',
        `Invalid frame ${currentFrameNumber} in animation "${animationName}"`
      );
      stop(sprite, animationName);
      return;
    }

    sprite.element.style.background = spritesheet.cells[currentFrameNumber];
    sprite.currentFrame = currentFrameNumber;

    frameIndex++;
    if (frameIndex >= animation.frames.length) {
      if (shouldLoop) {
        frameIndex = 0;
      } else {
        stop(sprite, animationName);
        log(sprite, `Animation "${animationName}" completed`);
        return;
      }
    }
  }, animation.speed);

  sprite.activeIntervals.set(String(animationName), intervalId);
  return true;
}

/**
 * Stops one or all animations on the sprite. Triggers any registered end callbacks.
 * @param sprite - The sprite instance.
 * @param name - Optional animation name. If not provided, stops all animations.
 * @example
 * ```typescript
 * // Stop specific animation.
 * stop(sprite, 'walk');
 *
 * // Stop all animations.
 * stop(sprite);
 * ```
 */
export function stop(sprite: Sprite, name?: string | number): void {
  if (name) {
    const nameStr = String(name);
    const interval = sprite.activeIntervals.get(nameStr);
    if (interval) {
      clearInterval(interval);
      sprite.activeIntervals.delete(nameStr);
    }

    const animation = sprite.animations.find((anim) => anim.name === name);
    if (animation) {
      animation.stopped = true;

      const playedAnim = sprite.memory.playedAnimations.find(
        (pa) => pa.name === nameStr && !pa.length
      );
      if (playedAnim) {
        playedAnim.length = Date.now() - playedAnim.timestamp;
      }

      const callbacks = sprite.animationCallbacks.get(nameStr);
      if (callbacks) {
        callbacks.forEach((cb) => {
          try {
            cb();
          } catch (error) {
            logError(
              sprite,
              'stop',
              `Animation callback error for "${name}"`,
              error
            );
          }
        });
      }
    }
    log(sprite, `Animation "${name}" stopped`);
  } else {
    sprite.activeIntervals.forEach((_, animName) => stop(sprite, animName));
    log(sprite, 'All animations stopped');
  }
}

/**
 * Sets the sprite to display a specific frame from a spritesheet.
 * @param sprite - The sprite instance.
 * @param index - Frame index to display.
 * @param spritesheetId - Optional spritesheet ID. Uses current spritesheet if not provided.
 * @returns True if frame was set successfully, false if failed.
 * @example
 * ```typescript
 * // Set to frame 5 of current spritesheet.
 * const success = setFrame(sprite, 5);
 *
 * // Set to frame 2 of specific spritesheet.
 * setFrame(sprite, 2, 'idle-sheet');
 * ```
 */
export function setFrame(
  sprite: Sprite,
  index: number,
  spritesheetId?: string
): boolean {
  const targetSpritesheetId = spritesheetId || sprite.currentSpritesheetId;
  if (!targetSpritesheetId) {
    logError(sprite, 'setFrame', 'No spritesheet available');
    return false;
  }

  const spritesheet = sprite.spritesheets.get(targetSpritesheetId);
  if (!spritesheet) {
    logError(
      sprite,
      'setFrame',
      `Spritesheet "${targetSpritesheetId}" not found`
    );
    return false;
  }

  if (!validateFrameIndex(index, spritesheet)) {
    logError(
      sprite,
      'setFrame',
      `Invalid frame index ${index}. Sheet has ${
        spritesheet.cells.length
      } frames (0-${spritesheet.cells.length - 1})`
    );
    return false;
  }

  sprite.element.style.background = spritesheet.cells[index];
  sprite.currentFrame = index;
  sprite.currentSpritesheetId = targetSpritesheetId;
  log(sprite, `Frame set to ${index} (spritesheet: ${targetSpritesheetId})`);
  return true;
}

/**
 * Gets the currently displayed frame index.
 * @param sprite - The sprite instance.
 * @returns Current frame index or undefined if no frame is set.
 */
export const getCurrentFrame = (sprite: Sprite): number | undefined =>
  sprite.currentFrame;

/**
 * Gets the ID of the currently active spritesheet.
 * @param sprite - The sprite instance.
 * @returns Current spritesheet ID or undefined if none is set.
 */
export const getCurrentSheet = (sprite: Sprite): string | undefined =>
  sprite.currentSpritesheetId;

/**
 * Appends the sprite's DOM element to a parent element.
 * @param sprite - The sprite instance.
 * @param parent - Parent HTML element.
 * @returns True if appended successfully, false if failed.
 * @example
 * ```typescript
 * const gameContainer = document.getElementById('game');
 * const success = appendTo(sprite, gameContainer);
 * if (!success) {
 *   console.log('Failed to append sprite to container');
 * }
 * ```
 */
export function appendTo(sprite: Sprite, parent: HTMLElement): boolean {
  if (!parent || !(parent instanceof HTMLElement)) {
    logError(sprite, 'appendTo', 'Parent must be a valid HTMLElement');
    return false;
  }

  try {
    parent.appendChild(sprite.element);
    log(sprite, `Appended to ${parent.tagName.toLowerCase()}`);
    return true;
  } catch (error) {
    logError(sprite, 'appendTo', 'Failed to append to parent element', error);
    return false;
  }
}

/**
 * Returns a deep copy of the sprite's memory for analytics and debugging.
 * @param sprite - The sprite instance.
 * @returns Copy of sprite memory containing animation statistics.
 * @example
 * ```typescript
 * const memory = getMemory(sprite);
 * console.log(`Total animations played: ${memory.playedAnimations.length}`);
 * ```
 */
export function getMemory(sprite: Sprite): SpriteMemory {
  return {
    ...sprite.memory,
    playedAnimations: [...sprite.memory.playedAnimations],
  };
}

/**
 * Registers a callback to be executed when an animation ends (completes without looping).
 * @param sprite - The sprite instance.
 * @param name - Animation name.
 * @param callback - Function to call when animation ends.
 * @returns Function to unregister the callback, or null if registration failed.
 * @example
 * ```typescript
 * const unregister = onEnd(sprite, 'attack', () => {
 *   console.log('Attack animation finished!');
 * });
 *
 * if (unregister) {
 *   // Later, remove the callback.
 *   unregister();
 * }
 * ```
 */
export function onEnd(
  sprite: Sprite,
  name: string | number,
  callback: () => void
): (() => void) | null {
  if (!sprite.animations.find((anim) => anim.name === name)) {
    logError(sprite, 'onEnd', `Animation "${name}" not found`);
    return null;
  }

  const nameStr = String(name);
  if (!sprite.animationCallbacks.has(nameStr)) {
    sprite.animationCallbacks.set(nameStr, new Set());
  }

  sprite.animationCallbacks.get(nameStr)!.add(callback);

  return () => {
    const callbacks = sprite.animationCallbacks.get(nameStr);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        sprite.animationCallbacks.delete(nameStr);
      }
    }
  };
}

/**
 * Completely destroys the sprite, cleaning up all resources and removing the DOM element.
 * @param sprite - The sprite instance.
 * @example
 * ```typescript
 * // Clean up when sprite is no longer needed.
 * destroy(sprite);
 * ```
 */
export function destroy(sprite: Sprite): void {
  sprite.activeIntervals.forEach((intervalId) => clearInterval(intervalId));
  sprite.activeIntervals.clear();
  sprite.animationCallbacks.clear();
  sprite.spritesheets.clear();
  sprite.memory.playedAnimations.length = 0;
  sprite.element.remove();
  log(sprite, 'Sprite destroyed');
}

/**
 * Generates CSS background position strings for each cell in the spritesheet.
 * @param sheet - The spritesheet configuration.
 * @returns Array of CSS background strings for each frame.
 */
function createSpriteCells(sheet: SpriteSheet): string[] {
  const cells: string[] = [];

  for (let row = 0; row < sheet.rows; row++) {
    for (let col = 0; col < sheet.columns; col++) {
      const x = -(col * sheet.width);
      const y = -(row * sheet.height);
      cells.push(`url('${sheet.spritesheet}') ${x}px ${y}px`);
    }
  }

  return cells;
}

/**
 * Determines which spritesheet to use for an animation based on animation config and sprite state.
 * @param sprite - The sprite instance.
 * @param animation - The animation configuration.
 * @returns The spritesheet to use or undefined if none available.
 */
function getSpriteSheetForAnimation(
  sprite: Sprite,
  animation: SpriteAnimation
): SpriteSheet | undefined {
  if (animation.spritesheet) {
    return sprite.spritesheets.get(animation.spritesheet);
  }

  if (
    sprite.currentSpritesheetId &&
    sprite.spritesheets.has(sprite.currentSpritesheetId)
  ) {
    return sprite.spritesheets.get(sprite.currentSpritesheetId);
  }

  return sprite.spritesheets.values().next().value;
}

/**
 * Validates that a frame index is within the bounds of a spritesheet.
 * @param index - Frame index to validate.
 * @param sheet - Spritesheet to check against.
 * @returns True if the frame index is valid.
 */
function validateFrameIndex(index: number, sheet: SpriteSheet): boolean {
  const maxIndex = sheet.cells.length - 1;
  return index >= 0 && index <= maxIndex;
}

/**
 * Loads an image and returns its natural dimensions.
 * @param url - Image URL to load.
 * @returns Promise resolving to image dimensions.
 */
function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}
