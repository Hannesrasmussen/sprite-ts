export type Sprite = {
  /**
   * @description The name of the sprite.
   */
  readonly name: string;
  /**
   * @description The width of the sprite element.
   */
  readonly width: number;
  /**
   * @description The height of the sprite element.
   */
  readonly height: number;
  /**
   * @description The element of the sprite.
   */
  readonly element: HTMLDivElement;
  /**
   * @description The spritesheets of the sprite.
   */
  readonly spritesheets: Map<string, SpriteSheet>;
  /**
   * @description The animations of the sprite.
   */
  readonly animations: SpriteAnimation[];
  /**
   * @description The active intervals of the sprite.
   */
  readonly activeIntervals: Map<string, number>;
  /**
   * @description The animation callbacks of the sprite.
   */
  readonly animationCallbacks: Map<string, Set<() => void>>;
  /**
   * @description The memory of the sprite. Useful for reading statistics or debugging.
   */
  readonly memory: SpriteMemory;
  /**
   * @description The current frame of the sprite.
   */
  currentFrame: number | undefined;
  /**
   * @description The current spritesheet id of the sprite.
   */
  currentSpritesheetId: string | undefined;
  /**
   * @description The last played animation of the sprite.
   */
  lastPlayedAnimation: string | undefined;
  /**
   * @description Whether to enable debug logging.
   */
  help: boolean;
};

export type SpriteOptions = {
  /**
   * @description The name of the sprite.
   */
  name: string;
  /**
   * @description The width of the sprite element.
   */
  width: number;
  /**
   * @description The height of the sprite element.
   */
  height: number;
  /**
   * @description Enable debug logging.
   */
  help?: boolean;
  /**
   * @description The spritesheet URL(s). Amount of cells is automatically calculated based on the spritesheet size and the cell size.
   * @example 'src/assets/character_idle.png'
   * @example ['src/assets/character_idle.png', 'src/assets/character_walk.png']
   */
  spritesheets?: Array<string> | string;
  /**
   * @description The height of a cell in the spritesheet.
   */
  cellHeight?: number;
  /**
   * @description The width of a cell in the spritesheet.
   */
  cellWidth?: number;
};

export type SpriteSheet = {
  /**
   * @description The spritesheet URL.
   */
  spritesheet: string;
  /**
   * @description The number of columns in the spritesheet.
   */
  columns: number;
  /**
   * @description The number of rows in the spritesheet.
   */
  rows: number;
  /**
   * @description The generated cells.
   */
  cells: string[];
  /**
   * @description The width of each cell.
   */
  width: number;
  /**
   * @description The height of each cell.
   */
  height: number;
};

export type SpriteAnimation = {
  /**
   * @description The name of the animation.
   */
  name: string | number;
  /**
   * @description The start frame of the animation.
   */
  start: number;
  /**
   * @description The end frame of the animation.
   */
  end: number;
  /**
   * @description The frames (indexes) of the animation.
   */
  frames: Array<number>;
  /**
   * @description The speed of the animation.
   */
  speed: number;
  /**
   * @description Whether or not the animation is stopped by default.
   */
  stopped: boolean;
  /**
   * @description Whether or not the animation should loop by default.
   */
  loop: boolean;
  /**
   * @description The spritesheet identifier to use for this animation.
   */
  spritesheet?: string;
};

export type SpriteAnimationOptions = {
  /**
   * @description The name of the animation.
   */
  name: string | number;
  /**
   * @description The start frame of the animation.
   */
  start?: number;
  /**
   * @description The end frame of the animation.
   */
  end?: number;
  /**
   * @description The frames (indexes) of the animation.
   */
  frames?: Array<number>;
  /**
   * @description The speed of the animation.
   */
  speed?: number;
  /**
   * @description Whether or not the animation should loop by default.
   */
  loop?: boolean;
  /**
   * @description The spritesheet identifier to use for this animation.
   */
  spritesheet?: string;
};

export type SpriteMemory = {
  /**
   * @description Array of played animations (in order of playing).
   */
  playedAnimations: Array<{
    /**
     * @description The name of the animation.
     */
    name: string;
    /**
     * @description Timestamp of when the animation was played.
     */
    timestamp: number;
    /**
     * @description Amount of time the animation was played for (in milliseconds).
     */
    length: number;
    /**
     * @description Whether the animation looped.
     */
    looped: boolean;
  }>;
};
