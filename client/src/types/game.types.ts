export interface GameProps {
  level: number;
  onGameOver: (score: number) => void;
  onLevelComplete: (score: number) => void;
  settings: {
    soundEnabled: boolean;
    difficulty: string;
    particleEffects: boolean;
  };
}

export interface GameState {
  score: number;
  lives: number;
  isPlaying: boolean;
  isPaused: boolean;
}

export interface Invader {
  x: number;
  y: number;
  width: number;
  height: number;
  type: number;
  isAlive: boolean;
}

export interface Laser {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Explosion {
  x: number;
  y: number;
  width: number;
  height: number;
  frame: number;
  maxFrames: number;
}

export interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
}
