import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createSprite,
  addSheet,
  addAnimation,
  play,
  stop,
  setFrame,
  getCurrentFrame,
  getCurrentSheet,
  appendTo,
  getMemory,
  onEnd,
  destroy,
  removeSheet,
  getSheet,
  getSheets,
  hasSheet,
} from './sprite';
import type { Sprite } from './types';

Object.defineProperty(globalThis, 'Image', {
  value: class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src = '';
    width = 0;
    height = 0;

    constructor() {
      // Simulate async image loading with proper dimensions.
      setTimeout(() => {
        this.width = 128;
        this.height = 64;
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }
  },
});

// Mock document.createElement
const mockElement = {
  className: '',
  id: '',
  style: {},
  draggable: false,
  remove: vi.fn(),
  appendChild: vi.fn(),
  nodeType: 1,
  tagName: 'DIV',
} as unknown as HTMLDivElement;

vi.stubGlobal('document', {
  createElement: vi.fn(() => mockElement),
});

describe('Sprite', () => {
  let sprite: Sprite;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock element.
    Object.assign(mockElement, {
      className: '',
      id: '',
      style: {},
      draggable: false,
      remove: vi.fn(),
      appendChild: vi.fn(),
      nodeType: 1,
      tagName: 'DIV',
    });
  });

  afterEach(() => {
    if (sprite) {
      destroy(sprite);
    }
  });

  describe('createSprite', () => {
    it('should create a sprite with valid options', () => {
      sprite = createSprite({
        name: 'test-sprite',
        width: 32,
        height: 32,
      })!;

      expect(sprite).toBeDefined();
      expect(sprite.name).toBe('test-sprite');
      expect(sprite.width).toBe(32);
      expect(sprite.height).toBe(32);
      expect(sprite.element).toBeDefined();
      expect(sprite.spritesheets).toBeInstanceOf(Map);
      expect(sprite.animations).toEqual([]);
      expect(sprite.help).toBe(false);
    });

    it('should create a sprite with help mode enabled', () => {
      sprite = createSprite({
        name: 'test-sprite',
        width: 32,
        height: 32,
        help: true,
      })!;

      expect(sprite.help).toBe(true);
    });

    it('should return null for invalid name', () => {
      const result = createSprite({
        name: '',
        width: 32,
        height: 32,
      });

      expect(result).toBeNull();
    });

    it('should return null for invalid width', () => {
      const result = createSprite({
        name: 'test',
        width: 0,
        height: 32,
      });

      expect(result).toBeNull();
    });

    it('should return null for invalid height', () => {
      const result = createSprite({
        name: 'test',
        width: 32,
        height: -1,
      });

      expect(result).toBeNull();
    });

    it('should configure DOM element correctly', () => {
      sprite = createSprite({
        name: 'test-sprite',
        width: 64,
        height: 48,
      })!;

      expect(mockElement.className).toBe('sprite');
      expect(mockElement.id).toBe('test-sprite');
      expect(mockElement.draggable).toBe(false);
      expect(mockElement.style.width).toBe('64px');
      expect(mockElement.style.height).toBe('48px');
      expect(mockElement.style.position).toBe('absolute');
      expect(mockElement.style.imageRendering).toBe('pixelated');
    });
  });

  describe('addSheet', () => {
    beforeEach(() => {
      sprite = createSprite({
        name: 'test-sprite',
        width: 32,
        height: 32,
      })!;
    });

    it('should add a spritesheet with auto-detection', async () => {
      const sheetId = await addSheet(sprite, '/test-sheet.png');

      expect(sheetId).toBeDefined();
      expect(typeof sheetId).toBe('string');
      expect(sprite.spritesheets.size).toBe(1);
    });

    it('should add a spritesheet with custom options', async () => {
      const sheetId = await addSheet(sprite, '/test-sheet.png', {
        columns: 4,
        rows: 2,
        cellWidth: 32,
        cellHeight: 32,
        id: 'custom-sheet',
      });

      expect(sheetId).toBe('custom-sheet');
      expect(sprite.spritesheets.has('custom-sheet')).toBe(true);
    });

    it('should handle cellSize option', async () => {
      const sheetId = await addSheet(sprite, '/test-sheet.png', {
        cellSize: 16,
        id: 'small-cells',
      });

      expect(sheetId).toBe('small-cells');
      const sheet = sprite.spritesheets.get('small-cells');
      expect(sheet?.width).toBe(16);
      expect(sheet?.height).toBe(16);
    });
  });

  describe('sheet management', () => {
    beforeEach(async () => {
      sprite = createSprite({
        name: 'test-sprite',
        width: 32,
        height: 32,
      })!;
      await addSheet(sprite, '/test-sheet.png', { id: 'test-sheet' });
    });

    it('should remove a sheet', () => {
      const removed = removeSheet(sprite, 'test-sheet');
      expect(removed).toBe(true);
      expect(sprite.spritesheets.has('test-sheet')).toBe(false);
    });

    it('should return false when removing non-existent sheet', () => {
      const removed = removeSheet(sprite, 'non-existent');
      expect(removed).toBe(false);
    });

    it('should get a specific sheet', () => {
      const sheet = getSheet(sprite, 'test-sheet');
      expect(sheet).toBeDefined();
      expect(sheet?.spritesheet).toBe('/test-sheet.png');
    });

    it('should get all sheets', () => {
      const sheets = getSheets(sprite);
      expect(sheets).toHaveLength(1);
      expect(sheets[0].spritesheet).toBe('/test-sheet.png');
    });

    it('should check if sheet exists', () => {
      expect(hasSheet(sprite, 'test-sheet')).toBe(true);
      expect(hasSheet(sprite, 'non-existent')).toBe(false);
    });
  });

  describe('memory and basic functionality', () => {
    beforeEach(() => {
      sprite = createSprite({
        name: 'test-sprite',
        width: 32,
        height: 32,
      })!;
    });

    it('should get sprite memory', () => {
      const memory = getMemory(sprite);
      expect(memory).toBeDefined();
      expect(memory.playedAnimations).toEqual([]);
    });

    it('should handle frame getters when no frame is set', () => {
      expect(getCurrentFrame(sprite)).toBeUndefined();
      expect(getCurrentSheet(sprite)).toBeUndefined();
    });
  });

  describe('DOM integration', () => {
    beforeEach(() => {
      sprite = createSprite({
        name: 'test-sprite',
        width: 32,
        height: 32,
      })!;
    });

    it('should fail to append to invalid parent', () => {
      const invalidParent = { nodeType: 3 } as unknown as HTMLElement; // Text node.
      const success = appendTo(sprite, invalidParent);

      expect(success).toBe(false);
    });

    it('should fail to append to null parent', () => {
      const success = appendTo(sprite, null as unknown as HTMLElement);

      expect(success).toBe(false);
    });
  });

  describe('destroy', () => {
    beforeEach(async () => {
      sprite = createSprite({
        name: 'test-sprite',
        width: 32,
        height: 32,
      })!;
      await addSheet(sprite, '/test-sheet.png', { id: 'test-sheet' });
    });

    it('should clean up all resources', () => {
      destroy(sprite);

      expect(sprite.spritesheets.size).toBe(0);
      expect(sprite.animations).toHaveLength(0);
      expect(sprite.activeIntervals.size).toBe(0);
      expect(sprite.animationCallbacks.size).toBe(0);
      expect(mockElement.remove).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      sprite = createSprite({
        name: 'test-sprite',
        width: 32,
        height: 32,
      })!;
    });

    it('should handle invalid animation names', () => {
      const success = addAnimation(sprite, {
        name: '',
        start: 0,
        end: 1,
        speed: 500,
      });

      expect(success).toBe(false);
    });

    it('should handle non-existent animations in play', () => {
      const success = play(sprite, 'non-existent');
      expect(success).toBe(false);
    });

    it('should handle non-existent animations in stop', () => {
      // Should not throw.
      stop(sprite, 'non-existent');
      expect(sprite.activeIntervals.size).toBe(0);
    });

    it('should handle invalid frame indices', () => {
      const success = setFrame(sprite, -1);
      expect(success).toBe(false);
    });

    it('should handle non-existent sheets in setFrame', () => {
      const success = setFrame(sprite, 0, 'non-existent');
      expect(success).toBe(false);
    });

    it('should handle non-existent animations in onEnd', () => {
      const callback = vi.fn();
      const unsubscribe = onEnd(sprite, 'non-existent', callback);
      expect(unsubscribe).toBeNull();
    });
  });
});
