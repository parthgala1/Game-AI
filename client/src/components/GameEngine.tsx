import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../hooks/use-toast";

// Game asset imports
import playerShipImg from "../assets/player-ship.png";
import invader1Img from "../assets/invader1.png";
import invader2Img from "../assets/invader2.png";
import invader3Img from "../assets/invader3.png";
import explosionImg from "../assets/explosion.png";
import {
  Block,
  Explosion,
  GameProps,
  GameState,
  Invader,
  Laser,
  Player,
} from "@/types/game.types";

const GameEngine: React.FC<GameProps> = ({
  level,
  onGameOver,
  onLevelComplete,
  settings,
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    isPlaying: false,
    isPaused: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState<Player>({
    x: 0,
    y: 0,
    width: 48,
    height: 32,
    speed: 5,
  });

  // References for game elements
  const invadersRef = useRef<Invader[]>([]);
  const playerLasersRef = useRef<Laser[]>([]);
  const enemyLasersRef = useRef<Laser[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameId = useRef<number>(0);
  const lastEnemyFireTime = useRef<number>(0);
  const invaderDirection = useRef<number>(1);
  const invaderSpeed = useRef<number>(1);
  const imagesLoaded = useRef<boolean>(false);

  // Image references
  const playerShipImgRef = useRef<HTMLImageElement>(new Image());
  const invader1ImgRef = useRef<HTMLImageElement>(new Image());
  const invader2ImgRef = useRef<HTMLImageElement>(new Image());
  const invader3ImgRef = useRef<HTMLImageElement>(new Image());
  const explosionImgRef = useRef<HTMLImageElement>(new Image());

  const { toast } = useToast();

  // Load level data - this would typically come from a server
  const getLevelData = (levelId: number) => {
    // Example level data format
    const levelData = {
      1: {
        blocks: [
          { x: 100, y: 400, width: 60, height: 20, health: 3 },
          { x: 200, y: 400, width: 60, height: 20, health: 3 },
          { x: 300, y: 400, width: 60, height: 20, health: 3 },
          { x: 400, y: 400, width: 60, height: 20, health: 3 },
          { x: 500, y: 400, width: 60, height: 20, health: 3 },
          { x: 600, y: 400, width: 60, height: 20, health: 3 },
        ],
        enemies: 24, // Number of enemies to spawn
      },
      2: {
        blocks: [
          { x: 150, y: 400, width: 60, height: 20, health: 2 },
          { x: 300, y: 400, width: 60, height: 20, health: 2 },
          { x: 450, y: 400, width: 60, height: 20, health: 2 },
          { x: 600, y: 400, width: 60, height: 20, health: 2 },
        ],
        enemies: 32,
      },
      // Add more levels as needed
    };

    // Return the level data or default values if level doesn't exist
    return (
      levelData[levelId as keyof typeof levelData] || {
        blocks: [],
        enemies: 24,
      }
    );
  };

  // Load images
  useEffect(() => {
    console.log("Loading game assets for level:", level);

    if (imagesLoaded.current) {
      console.log("Images already loaded, initializing game directly");
      setIsLoading(false);
      initializeGame();
      return;
    }

    const imagesToLoad = [
      { ref: playerShipImgRef, src: playerShipImg },
      { ref: invader1ImgRef, src: invader1Img },
      { ref: invader2ImgRef, src: invader2Img },
      { ref: invader3ImgRef, src: invader3Img },
      { ref: explosionImgRef, src: explosionImg },
    ];

    let loadedCount = 0;

    const onImageLoad = () => {
      loadedCount++;
      console.log(`Loaded image ${loadedCount}/${imagesToLoad.length}`);
      if (loadedCount === imagesToLoad.length) {
        console.log("All images loaded, initializing game");
        imagesLoaded.current = true;
        setIsLoading(false);
        setTimeout(() => {
          initializeGame();
        }, 100);
      }
    };

    imagesToLoad.forEach((img) => {
      const image = new Image();
      image.onload = onImageLoad;
      image.src = img.src;
      img.ref.current = image;
    });

    return () => {
      imagesToLoad.forEach((img) => {
        if (img.ref.current) {
          img.ref.current.onload = null;
        }
      });
    };
  }, [level]);

  // Initialize the game
  const initializeGame = () => {
    console.log("Initializing game for level:", level);
    if (!gameRef.current) {
      console.error("Game container ref is not available");
      return;
    }

    const gameWidth = gameRef.current.clientWidth;
    const gameHeight = gameRef.current.clientHeight;

    console.log("Game dimensions:", gameWidth, "x", gameHeight);

    // Set player initial position
    setPlayer((prev) => ({
      ...prev,
      x: (gameWidth - prev.width) / 2,
      y: gameHeight - prev.height - 16,
    }));

    // Get level data
    const levelData = getLevelData(level);

    // Create blocks
    blocksRef.current = levelData.blocks.map((block) => ({
      ...block,
      health: block.health || 3,
    }));

    // Create invaders based on level
    const rows = Math.min(Math.ceil(levelData.enemies / 8), 5); // Max 5 rows
    const cols = Math.min(Math.ceil(levelData.enemies / rows), 8); // Max 8 columns
    const invaderSize = { width: 32, height: 32 };
    const padding = 16;

    invadersRef.current = [];

    // Create a grid of invaders
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (invadersRef.current.length < levelData.enemies) {
          invadersRef.current.push({
            x: col * (invaderSize.width + padding) + 40,
            y: row * (invaderSize.height + padding) + 60,
            width: invaderSize.width,
            height: invaderSize.height,
            type: row % 3, // 0, 1, or 2 for different invader types
            isAlive: true,
          });
        }
      }
    }

    // Set difficulty based on level and settings
    invaderSpeed.current = 1 + level * 0.1;
    if (settings.difficulty === "hard") invaderSpeed.current *= 1.5;
    if (settings.difficulty === "easy") invaderSpeed.current *= 0.7;

    // Clear other game elements
    playerLasersRef.current = [];
    enemyLasersRef.current = [];
    explosionsRef.current = [];

    setGameState((prev) => ({
      ...prev,
      score: 0,
      lives: 3,
      isPlaying: true,
      isPaused: false,
    }));

    // Start game animation
    console.log("Starting game loop");
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    gameLoop();
  };

  // Main game loop
  const gameLoop = () => {
    if (!gameRef.current || !gameState.isPlaying || gameState.isPaused) return;

    updateGame();
    renderGame();

    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  // Update game state
  const updateGame = () => {
    if (!gameRef.current) return;

    const gameWidth = gameRef.current.clientWidth;
    const gameHeight = gameRef.current.clientHeight;

    // Player movement
    if (keysPressed.current.has("ArrowLeft") || keysPressed.current.has("a")) {
      setPlayer((prev) => ({
        ...prev,
        x: Math.max(0, prev.x - prev.speed),
      }));
    }

    if (keysPressed.current.has("ArrowRight") || keysPressed.current.has("d")) {
      setPlayer((prev) => ({
        ...prev,
        x: Math.min(gameWidth - prev.width, prev.x + prev.speed),
      }));
    }

    // Player shooting
    if (keysPressed.current.has(" ") && playerLasersRef.current.length < 3) {
      playerLasersRef.current.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 16,
        speed: 8,
      });

      // Debounce shooting
      keysPressed.current.delete(" ");
      setTimeout(() => {
        if (keysPressed.current.has(" ")) {
          keysPressed.current.delete(" ");
        }
      }, 300);
    }

    // Update player lasers
    playerLasersRef.current = playerLasersRef.current.filter((laser) => {
      laser.y -= laser.speed;

      // Check for collisions with blocks
      const hitBlock = blocksRef.current.find(
        (block) =>
          laser.x < block.x + block.width &&
          laser.x + laser.width > block.x &&
          laser.y < block.y + block.height &&
          laser.y + laser.height > block.y &&
          block.health > 0
      );

      if (hitBlock) {
        hitBlock.health--;
        return false;
      }

      // Check for collisions with invaders
      const hitInvader = invadersRef.current.find(
        (invader) =>
          invader.isAlive &&
          laser.x < invader.x + invader.width &&
          laser.x + laser.width > invader.x &&
          laser.y < invader.y + invader.height &&
          laser.y + laser.height > invader.y
      );

      if (hitInvader) {
        hitInvader.isAlive = false;

        // Add explosion
        explosionsRef.current.push({
          x: hitInvader.x,
          y: hitInvader.y,
          width: hitInvader.width,
          height: hitInvader.height,
          frame: 0,
          maxFrames: 8,
        });

        // Update score
        setGameState((prev) => ({
          ...prev,
          score: prev.score + (hitInvader.type + 1) * 10,
        }));

        return false;
      }

      return laser.y > 0;
    });

    // Update invaders
    let needToChangeDirection = false;

    // Find rightmost and leftmost active invaders
    const activeInvaders = invadersRef.current.filter(
      (invader) => invader.isAlive
    );

    if (activeInvaders.length === 0) {
      // Level complete
      onLevelComplete(gameState.score);
      return;
    }

    const rightmostInvader = activeInvaders.reduce((prev, current) =>
      current.x > prev.x ? current : prev
    );
    const leftmostInvader = activeInvaders.reduce((prev, current) =>
      current.x < prev.x ? current : prev
    );

    if (
      rightmostInvader.x + rightmostInvader.width + invaderSpeed.current >
      gameWidth
    ) {
      needToChangeDirection = true;
    } else if (leftmostInvader.x - invaderSpeed.current < 0) {
      needToChangeDirection = true;
    }

    if (needToChangeDirection) {
      invaderDirection.current *= -1;

      // Move invaders down
      invadersRef.current.forEach((invader) => {
        if (invader.isAlive) {
          invader.y += 20;

          // Check if invaders reached bottom
          if (invader.y + invader.height >= player.y) {
            // Game over
            setGameState((prev) => ({ ...prev, isPlaying: false }));
            onGameOver(gameState.score);
          }
        }
      });
    } else {
      // Move invaders horizontally
      invadersRef.current.forEach((invader) => {
        if (invader.isAlive) {
          invader.x += invaderDirection.current * invaderSpeed.current;
        }
      });
    }

    // Enemy shooting
    const now = Date.now();
    const enemyFireInterval = 1000 - level * 50; // Decrease interval as level increases

    if (
      now - lastEnemyFireTime.current > enemyFireInterval &&
      activeInvaders.length > 0
    ) {
      // Select random shooter from bottom row of each column
      const bottomInvaders: Invader[] = [];
      const groupedByCol: Record<number, Invader[]> = {};

      activeInvaders.forEach((invader) => {
        const col = Math.floor(invader.x);
        if (!groupedByCol[col]) groupedByCol[col] = [];
        groupedByCol[col].push(invader);
      });

      Object.values(groupedByCol).forEach((invadersInCol) => {
        const bottomInvader = invadersInCol.reduce((prev, current) =>
          current.y > prev.y ? current : prev
        );
        bottomInvaders.push(bottomInvader);
      });

      if (bottomInvaders.length > 0) {
        const shooter =
          bottomInvaders[Math.floor(Math.random() * bottomInvaders.length)];

        enemyLasersRef.current.push({
          x: shooter.x + shooter.width / 2 - 2,
          y: shooter.y + shooter.height,
          width: 4,
          height: 16,
          speed: 4,
        });

        lastEnemyFireTime.current = now;
      }
    }

    // Update enemy lasers
    enemyLasersRef.current = enemyLasersRef.current.filter((laser) => {
      laser.y += laser.speed;

      // Check for collision with blocks
      const hitBlock = blocksRef.current.find(
        (block) =>
          block.health > 0 &&
          laser.x < block.x + block.width &&
          laser.x + laser.width > block.x &&
          laser.y < block.y + block.height &&
          laser.y + laser.height > block.y
      );

      if (hitBlock) {
        hitBlock.health--;
        return false;
      }

      // Check for collision with player
      const hitPlayer =
        laser.x < player.x + player.width &&
        laser.x + laser.width > player.x &&
        laser.y < player.y + player.height &&
        laser.y + laser.height > player.y;

      if (hitPlayer) {
        // Player hit
        setGameState((prev) => {
          const newLives = prev.lives - 1;

          if (newLives <= 0) {
            // Game over
            onGameOver(prev.score);
            return { ...prev, lives: 0, isPlaying: false };
          }

          // Add explosion at player position
          explosionsRef.current.push({
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height,
            frame: 0,
            maxFrames: 8,
          });

          return { ...prev, lives: newLives };
        });

        return false;
      }

      return laser.y < gameHeight;
    });

    // Update explosions
    explosionsRef.current = explosionsRef.current.filter((explosion) => {
      explosion.frame++;
      return explosion.frame < explosion.maxFrames;
    });
  };

  // Render game elements
  const renderGame = () => {
    if (!gameRef.current) return;

    // Clear existing game elements
    const existingElements = gameRef.current.querySelectorAll(".game-element");
    existingElements.forEach((el) => el.remove());

    // Render player
    const playerElement = document.createElement("div");
    playerElement.className = "player-ship game-element";
    playerElement.style.left = `${player.x}px`;
    playerElement.style.top = `${player.y}px`;
    playerElement.style.width = `${player.width}px`;
    playerElement.style.height = `${player.height}px`;
    playerElement.style.backgroundImage = `url(${playerShipImgRef.current.src})`;
    playerElement.style.backgroundSize = "contain";
    playerElement.style.backgroundRepeat = "no-repeat";
    playerElement.style.position = "absolute";
    gameRef.current.appendChild(playerElement);

    // Render blocks
    blocksRef.current.forEach((block) => {
      if (block.health <= 0) return;

      const blockElement = document.createElement("div");
      blockElement.className = "block game-element";
      blockElement.style.left = `${block.x}px`;
      blockElement.style.top = `${block.y}px`;
      blockElement.style.width = `${block.width}px`;
      blockElement.style.height = `${block.height}px`;
      blockElement.style.position = "absolute";
      blockElement.style.backgroundColor = `rgba(0, 255, ${
        128 * (block.health / 3)
      }, ${0.5 + block.health / 6})`;
      blockElement.style.borderRadius = "4px";
      gameRef.current.appendChild(blockElement);
    });

    // Render invaders
    invadersRef.current.forEach((invader) => {
      if (!invader.isAlive) return;

      const invaderElement = document.createElement("div");
      invaderElement.className = "invader game-element";
      invaderElement.style.left = `${invader.x}px`;
      invaderElement.style.top = `${invader.y}px`;
      invaderElement.style.width = `${invader.width}px`;
      invaderElement.style.height = `${invader.height}px`;
      invaderElement.style.position = "absolute";

      // Select correct invader image
      let invaderImg;
      switch (invader.type) {
        case 0:
          invaderImg = invader1ImgRef.current.src;
          break;
        case 1:
          invaderImg = invader2ImgRef.current.src;
          break;
        case 2:
          invaderImg = invader3ImgRef.current.src;
          break;
        default:
          invaderImg = invader1ImgRef.current.src;
      }

      invaderElement.style.backgroundImage = `url(${invaderImg})`;
      invaderElement.style.backgroundSize = "contain";
      invaderElement.style.backgroundRepeat = "no-repeat";
      gameRef.current.appendChild(invaderElement);
    });

    // Render player lasers
    playerLasersRef.current.forEach((laser) => {
      const laserElement = document.createElement("div");
      laserElement.className = "laser game-element";
      laserElement.style.left = `${laser.x}px`;
      laserElement.style.top = `${laser.y}px`;
      laserElement.style.width = `${laser.width}px`;
      laserElement.style.height = `${laser.height}px`;
      laserElement.style.position = "absolute";
      laserElement.style.backgroundColor = "#00FFFF";
      gameRef.current.appendChild(laserElement);
    });

    // Render enemy lasers
    enemyLasersRef.current.forEach((laser) => {
      const laserElement = document.createElement("div");
      laserElement.className = "enemy-laser game-element";
      laserElement.style.left = `${laser.x}px`;
      laserElement.style.top = `${laser.y}px`;
      laserElement.style.width = `${laser.width}px`;
      laserElement.style.height = `${laser.height}px`;
      laserElement.style.position = "absolute";
      laserElement.style.backgroundColor = "#FF00FF";
      gameRef.current.appendChild(laserElement);
    });

    // Render explosions
    explosionsRef.current.forEach((explosion) => {
      const explosionElement = document.createElement("div");
      explosionElement.className = "explosion game-element";
      explosionElement.style.left = `${explosion.x}px`;
      explosionElement.style.top = `${explosion.y}px`;
      explosionElement.style.width = `${explosion.width}px`;
      explosionElement.style.height = `${explosion.height}px`;
      explosionElement.style.position = "absolute";
      explosionElement.style.backgroundImage = `url(${explosionImgRef.current.src})`;
      explosionElement.style.backgroundSize = "contain";
      explosionElement.style.backgroundRepeat = "no-repeat";
      explosionElement.style.opacity = String(
        1 - explosion.frame / explosion.maxFrames
      );
      gameRef.current.appendChild(explosionElement);
    });
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
        return;
      }

      if (gameState.isPaused) return;

      keysPressed.current.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState.isPaused]);

  // Handle game loop
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused && !isLoading) {
      gameLoop();
    } else if (gameState.isPaused) {
      cancelAnimationFrame(animationFrameId.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState.isPlaying, gameState.isPaused, isLoading]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current) {
        // Adjust player position on resize
        const gameWidth = gameRef.current.clientWidth;
        const gameHeight = gameRef.current.clientHeight;

        setPlayer((prev) => ({
          ...prev,
          x: Math.min(prev.x, gameWidth - prev.width),
          y: gameHeight - prev.height - 16,
        }));
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Handle component unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={gameRef}
        className="game-container pixel-corners w-[800px] h-[600px] bg-space-dark relative overflow-hidden"
        tabIndex={0} // Make the div focusable for keyboard input
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-space-dark">
            <div className="text-xl font-pixel text-white">Loading...</div>
          </div>
        ) : gameState.isPaused ? (
          <div className="absolute inset-0 flex items-center justify-center bg-space-dark/80 backdrop-blur-sm z-10">
            <div className="text-center">
              <h2 className="text-3xl font-pixel neon-text mb-4">PAUSED</h2>
              <p className="text-white mb-2">Press ESC to resume</p>
              <div className="flex justify-center gap-2 mt-4">
                <button
                  className="px-4 py-2 bg-space-medium border border-space-neon-green text-white rounded-md hover:bg-space-light"
                  onClick={() =>
                    setGameState((prev) => ({ ...prev, isPaused: false }))
                  }
                >
                  Resume
                </button>
                <button
                  className="px-4 py-2 bg-space-medium border border-space-neon-pink text-white rounded-md hover:bg-space-light"
                  onClick={() => {
                    setGameState((prev) => ({ ...prev, isPlaying: false }));
                    onGameOver(gameState.score);
                  }}
                >
                  Quit
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="text-white font-future">
          <span className="neon-text">SCORE:</span> {gameState.score}
        </div>
        <div className="text-white font-future">
          <span className="neon-pink-text">LEVEL:</span> {level}
        </div>
        <div className="text-white font-future">
          <span className="neon-blue-text">LIVES:</span> {gameState.lives}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <button
          className="px-4 py-2 bg-space-medium border border-space-neon-green text-white rounded-md hover:bg-space-light"
          onClick={() =>
            setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
          }
        >
          {gameState.isPaused ? "Resume" : "Pause"}
        </button>
      </div>
    </div>
  );
};

export default GameEngine;
