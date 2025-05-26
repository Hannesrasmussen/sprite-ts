/**
 * Sprite-TS - A TypeScript library for creating animated sprites from spritesheets.
 * @author Hannes Rasmussen
 * @version 0.4.0
 */

export {
  createSprite,
  addSheet,
  removeSheet,
  getSheet,
  getSheets,
  hasSheet,
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
} from '@/sprite';

export * from '@/types';

export { createSprite as default } from '@/sprite';
