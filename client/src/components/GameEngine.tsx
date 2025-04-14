import React, { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "../hooks/use-toast"; // Assuming this exists
import space_background from "../assets/space_background.png"; // Assuming this is the path to your background image

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
  LevelConfig, // Assuming you might define this type
} from "@/types/game.types"; // Make sure types are defined

// --- Constants ---
const GAME_WIDTH = 800;
const GAME_HEIGHT = 800;
const API_ENDPOINT = "http://127.0.0.1:5000/generate-level";
const MAX_EXPECTED_SCORE_PER_LEVEL = 1000; // Adjust as needed for normalization

import boxTemplateImg from "../assets/box_template.png";

// Add with other refs

const GameEngine: React.FC<GameProps> = ({
  level,
  onGameOver,
  onLevelComplete,
  settings,
  // Pass the previous score if needed for API call, or manage internally
  // previousScore = 0,
}) => {
  const boxTemplateImgRef = useRef<HTMLImageElement | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    isPlaying: false,
    isPaused: false,
  });

  // Separate loading states
  const [isAssetLoading, setIsAssetLoading] = useState(true);
  const [isApiLoading, setIsApiLoading] = useState(true);
  const isLoading = isAssetLoading || isApiLoading; // Combined loading state

  const [player, setPlayer] = useState<Player>({
    x: (GAME_WIDTH - 48) / 2, // Initial center based on const width
    y: GAME_HEIGHT - 32 - 20, // Initial bottom based on const height
    width: 48,
    height: 32,
    speed: 5,
    moveDirection: 0,
  });

  // State for fetched level data and background
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null); // Store fetched layout { blocks, enemies, ... }
  const [backgroundImageSrc, setBackgroundImageSrc] = useState<string | null>(
    null
  );

  // References
  const invadersRef = useRef<Invader[]>([]);
  const playerLasersRef = useRef<Laser[]>([]);
  const enemyLasersRef = useRef<Laser[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameId = useRef<number>(0);
  const lastEnemyFireTime = useRef<number>(0);
  const lastPlayerFireTime = useRef<number>(0);
  const playerFireCooldown = 300;
  const invaderDirection = useRef<number>(1);
  const invaderSpeed = useRef<number>(1); // Will be potentially overridden by API data or defaults
  const imagesLoaded = useRef<boolean>(false);
  const apiAbortController = useRef<AbortController | null>(null); // For cancelling fetch

  // Image references
  const playerShipImgRef = useRef<HTMLImageElement | null>(null);
  const invader1ImgRef = useRef<HTMLImageElement | null>(null);
  const invader2ImgRef = useRef<HTMLImageElement | null>(null);
  const invader3ImgRef = useRef<HTMLImageElement | null>(null);
  const explosionImgRef = useRef<HTMLImageElement | null>(null);

  const { toast } = useToast();

  // --- Helper Functions ---
  const mapDifficultyToValue = (difficultySetting: string): number => {
    switch (difficultySetting.toLowerCase()) {
      case "easy":
        return 0.3;
      case "medium":
        return 0.6;
      case "hard":
        return 0.9;
      default:
        return 0.6; // Default to medium
    }
  };

  const normalizeScore = (score: number, currentLevel: number): number => {
    if (currentLevel <= 0) return 0; // Avoid division by zero
    const maxScoreEstimate = currentLevel * MAX_EXPECTED_SCORE_PER_LEVEL;
    if (maxScoreEstimate <= 0) return 0;
    return Math.min(1, Math.max(0, score / maxScoreEstimate));
  };

  const calculateEnemyCount = (
    difficulty: string,
    score: number,
    level: number
  ): number => {
    const baseEnemies = 12;
    const difficultyMultiplier =
      {
        easy: 0.8,
        medium: 1,
        hard: 1.3,
      }[difficulty.toLowerCase()] || 1;

    const scoreBonus = Math.floor(score / 1000) * 2; // Every 1000 points adds 2 enemies
    const levelBonus = (level - 1) * 3; // Each level adds 3 enemies

    return Math.min(
      40,
      Math.max(
        8,
        Math.floor(baseEnemies * difficultyMultiplier) + scoreBonus + levelBonus
      )
    );
  };

  // --- Asset Loading ---
  useEffect(() => {
    console.log("Attempting to load game assets...");
    setIsAssetLoading(true); // Start asset loading
    imagesLoaded.current = false;

    let loadedCount = 0;
    // Add box template to image loading
    const imagesToLoad = [
      { ref: playerShipImgRef, src: playerShipImg },
      { ref: invader1ImgRef, src: invader1Img },
      { ref: invader2ImgRef, src: invader2Img },
      { ref: invader3ImgRef, src: invader3Img },
      { ref: explosionImgRef, src: explosionImg },
      { ref: boxTemplateImgRef, src: boxTemplateImg }, // Add this line
    ];
    const totalImages = imagesToLoad.length;

    const onImageLoad = (src: string) => {
      loadedCount++;
      if (loadedCount === totalImages) {
        console.log("All image assets loaded.");
        imagesLoaded.current = true;
        setIsAssetLoading(false); // Finish asset loading
      }
    };
    const onImageError = (src: string) => {
      console.error(`Failed to load image asset: ${src}`);
      toast({
        title: "Asset Load Error",
        description: `Failed to load ${src}`,
        variant: "destructive",
      });
      loadedCount++; // Still count it to potentially finish loading state
      if (loadedCount === totalImages) {
        console.warn("Finished loading assets (with errors).");
        imagesLoaded.current = true; // Mark as loaded even with errors to potentially proceed
        setIsAssetLoading(false);
      }
    };

    imagesToLoad.forEach((imgInfo) => {
      const image = new Image();
      image.onload = () => onImageLoad(imgInfo.src);
      image.onerror = () => onImageError(imgInfo.src);
      image.src = imgInfo.src;
      imgInfo.ref.current = image;
    });

    return () => {
      imagesToLoad.forEach((imgInfo) => {
        if (imgInfo.ref.current) {
          imgInfo.ref.current.onload = null;
          imgInfo.ref.current.onerror = null;
        }
      });
    };
  }, []); // Load assets only once on mount

  // --- API Level Generation ---
  useEffect(() => {
    // Cancel previous request if level or difficulty changes quickly
    if (apiAbortController.current) {
      apiAbortController.current.abort();
    }
    apiAbortController.current = new AbortController();
    const signal = apiAbortController.current.signal;

    console.log(
      `Fetching level ${level} data from API with difficulty: ${settings.difficulty}`
    );
    setIsApiLoading(true); // Start API loading
    setLevelConfig(null); // Reset previous config
    setBackgroundImageSrc(null); // Reset background

    // Determine the score to send (use previous level's score or 0)
    // This assumes you manage the score between levels outside this component
    // or you reset score to 0 each level. Let's assume score resets for simplicity here.
    const scoreForApi = normalizeScore(settings.userScore, level - 1); // Score from previous level (level-1), normalized
    const difficultyValue = mapDifficultyToValue(settings.difficulty);
    console.log(`Difficulty Value: ${difficultyValue}, Score: ${scoreForApi}`);

    fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        difficulty: difficultyValue,
        score: scoreForApi, // Send normalized score of *previous* level
        // You might need to send the current level number too, depending on API design
        level: level,
      }),
      signal: signal, // Pass the abort signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      // In the API response handling section
      .then((data) => {
        console.log("API Response Received:", data);

        // --- Validate API Data ---
        if (!data.layout || !data.image) {
          throw new Error(
            "Invalid API response format: missing layout or image."
          );
        }

        // Update layout validation
        if (!Array.isArray(data.layout)) {
          console.warn("API Response Warning: layout is not an array.");
          data.layout = []; // Default to empty if missing/invalid
        }

        // Process the layout data
        const processedLayout = {
          blocks: data.layout.map((block: any) => ({
            x: block.x,
            y: block.y,
            width: 32, // Standard block size
            height: 32,
            type: block.type,
            health: 3, // Default health for blocks
          })),
          enemies: calculateEnemyCount(
            settings.difficulty,
            settings.userScore,
            level
          ), // Default enemy count
        };

        // Set the processed layout
        setLevelConfig(processedLayout);

        // Create background image source
        const imgSrc = space_background;
        setBackgroundImageSrc(imgSrc);

        // Optional: Preload the background image for smoother transition
        const bgImg = new Image();
        bgImg.onload = () => {
          console.log("AI background image preloaded.");
          setIsApiLoading(false); // Finish API loading *after* background is ready
        };
        bgImg.onerror = () => {
          console.error(
            "Failed to preload AI background image from base64 data."
          );
          toast({
            title: "Background Error",
            description: "Could not load AI background.",
            variant: "destructive",
          });
          setBackgroundImageSrc(null); // Clear invalid src
          setIsApiLoading(false); // Still finish loading state
        };
        bgImg.src = imgSrc;
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          console.log("API fetch aborted");
        } else {
          console.error("Failed to fetch level data:", error);
          toast({
            title: "API Error",
            description: `Could not load level ${level}. ${error.message}`,
            variant: "destructive",
          });
          // Maybe load default level data as fallback?
          // setLevelConfig(getDefaultLevelData(level));
          setIsApiLoading(false); // Finish loading state even on error
        }
      });

    // Cleanup function
    return () => {
      console.log("Cleaning up API fetch effect.");
      if (apiAbortController.current) {
        apiAbortController.current.abort();
      }
    };
  }, [level, settings.difficulty, toast]); // Fetch when level or difficulty changes

  // --- Game Initialization ---
  const initializeGame = useCallback(() => {
    // Ensure everything is ready: Not loading, refs exist, API data loaded
    if (
      isLoading ||
      !gameRef.current ||
      !imagesLoaded.current ||
      !levelConfig
    ) {
      console.warn("Initialization skipped: Waiting for loading/refs/config.", {
        isLoading,
        hasRef: !!gameRef.current,
        imagesLoaded: imagesLoaded.current,
        hasConfig: !!levelConfig,
      });
      return;
    }

    console.log("Initializing game with fetched level config:", levelConfig);
    const gameWidth = gameRef.current.clientWidth; // Should be GAME_WIDTH
    const gameHeight = gameRef.current.clientHeight; // Should be GAME_HEIGHT

    // Set player initial position (already done in state init, but can re-center)
    setPlayer((prev) => ({
      ...prev,
      x: (gameWidth - prev.width) / 2,
      y: gameHeight - prev.height - 20,
    }));

    // --- Use Fetched Level Config ---
    // Create blocks (deep copy just in case)
    blocksRef.current = (levelConfig.blocks || []).map((block: any) => ({
      ...block,
      health: block.health || 3, // Ensure health property exists
    }));

    // Create invaders
    invadersRef.current = [];
    const numEnemies = levelConfig.enemies || 2; // Default if not provided
    const cols = 10;
    const rows = Math.ceil(numEnemies / cols);
    const invaderSize = { width: 32, height: 32 };
    const startX = 50;
    const startY = 80; // Start invaders a bit lower in 800x800
    const paddingX = 15;
    const paddingY = 15;
    let currentEnemies = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (currentEnemies >= numEnemies) break;
        invadersRef.current.push({
          x: startX + c * (invaderSize.width + paddingX),
          y: startY + r * (invaderSize.height + paddingY),
          width: invaderSize.width,
          height: invaderSize.height,
          type: r % 3,
          isAlive: true,
        });
        currentEnemies++;
      }
      if (currentEnemies >= numEnemies) break;
    }

    // Set invader speed (use API value or calculate based on level/difficulty)
    // Example: prioritize API value if available
    invaderSpeed.current =
      levelConfig.invaderBaseSpeed || 0.8 + (level - 1) * 0.1;
    if (settings.difficulty === "hard") invaderSpeed.current *= 1.4;
    if (settings.difficulty === "easy") invaderSpeed.current *= 0.7;
    invaderDirection.current = 1;

    // Clear dynamic elements
    playerLasersRef.current = [];
    enemyLasersRef.current = [];
    explosionsRef.current = [];
    keysPressed.current.clear();

    // Reset game state for the new level
    setGameState((prev) => ({
      ...prev, // Keep lives potentially? Or reset? Let's reset score/pause state.
      score: 0,
      isPlaying: true,
      isPaused: false,
    }));

    lastEnemyFireTime.current = Date.now();

    console.log("Game Initialization Complete.");
  }, [isLoading, levelConfig, level, settings.difficulty]); // Dependencies for init

  // --- Initialization Trigger ---
  useEffect(() => {
    // Attempt to initialize once loading is false AND config is available
    if (!isLoading && levelConfig) {
      initializeGame();
    }
  }, [isLoading, levelConfig, initializeGame]);

  // --- Game Update Logic (largely unchanged, ensure uses constants/refs) ---
  const updateGame = useCallback(() => {
    if (
      !gameRef.current ||
      !gameState.isPlaying ||
      gameState.isPaused ||
      !levelConfig
    )
      return; // Need levelConfig too

    const gameWidth = GAME_WIDTH; // Use constant
    const gameHeight = GAME_HEIGHT; // Use constant
    const now = Date.now();

    // --- Player Movement ---
    let playerMoved = false;
    let newPlayerX = player.x;
    if (keysPressed.current.has("arrowleft") || keysPressed.current.has("a")) {
      newPlayerX = Math.max(0, player.x - player.speed);
      playerMoved = true;
    }
    if (keysPressed.current.has("arrowright") || keysPressed.current.has("d")) {
      newPlayerX = Math.min(gameWidth - player.width, player.x + player.speed);
      playerMoved = true;
    }
    if (playerMoved) {
      setPlayer((prev) => ({ ...prev, x: newPlayerX }));
    }

    // --- Player Shooting ---
    if (
      keysPressed.current.has(" ") &&
      now - lastPlayerFireTime.current > playerFireCooldown
    ) {
      playerLasersRef.current.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 16,
        speed: 8,
      });
      lastPlayerFireTime.current = now;
    }

    // --- Update Player Lasers ---
    playerLasersRef.current = playerLasersRef.current.filter((laser) => {
      laser.y -= laser.speed;

      // Collision with blocks
      const hitBlockIndex = blocksRef.current.findIndex(
        (b) =>
          b.health > 0 &&
          laser.x < b.x + b.width &&
          laser.x + laser.width > b.x &&
          laser.y < b.y + b.height &&
          laser.y + laser.height > b.y
      );
      if (hitBlockIndex !== -1) {
        blocksRef.current[hitBlockIndex].health--;
        return false; // Laser destroyed
      }

      // Collision with invaders
      const hitInvaderIndex = invadersRef.current.findIndex(
        (i) =>
          i.isAlive &&
          laser.x < i.x + i.width &&
          laser.x + laser.width > i.x &&
          laser.y < i.y + i.height &&
          laser.y + laser.height > i.y
      );
      // Inside the player laser collision with invaders section
      if (hitInvaderIndex !== -1) {
        const hitInvader = invadersRef.current[hitInvaderIndex];
        hitInvader.isAlive = false;
        explosionsRef.current.push({
          x: hitInvader.x,
          y: hitInvader.y,
          width: hitInvader.width,
          height: hitInvader.height,
          frame: 0,
          maxFrames: 8,
        });

        // Update score calculation to include lives multiplier
        const baseScore = (hitInvader.type + 1) * 10;
        const livesMultiplier = 1 + gameState.lives * 0.5; // Each life adds 50% bonus
        const finalScore = Math.floor(baseScore * livesMultiplier);

        setGameState((prev) => ({
          ...prev,
          score: prev.score + finalScore,
        }));
        return false; // Laser destroyed
      }
      return laser.y + laser.height > 0;
    });

    // --- Update Invaders ---
    const activeInvaders = invadersRef.current.filter(
      (invader) => invader.isAlive
    );
    if (activeInvaders.length === 0 && gameState.isPlaying) {
      console.log("Level Complete!");
      setGameState((prev) => ({ ...prev, isPlaying: false })); // Stop game loop
      onLevelComplete(gameState.score); // Notify parent
      return;
    }

    let moveDownThisFrame = false;
    const invaderHorizontalStep =
      invaderDirection.current * invaderSpeed.current;
    const edgeBuffer = 10;

    for (const invader of activeInvaders) {
      const nextX = invader.x + invaderHorizontalStep;
      if (
        nextX <= edgeBuffer ||
        nextX + invader.width >= gameWidth - edgeBuffer
      ) {
        moveDownThisFrame = true;
        break;
      }
    }

    if (moveDownThisFrame) {
      invaderDirection.current *= -1;
      let gameOverTriggered = false; // Prevent multiple triggers in one frame
      invadersRef.current.forEach((invader) => {
        if (invader.isAlive) {
          invader.y += 20;
          if (
            !gameOverTriggered &&
            invader.y + invader.height >= player.y &&
            gameState.isPlaying
          ) {
            console.log("Game Over - Invader reached player line");
            setGameState((prev) => ({ ...prev, isPlaying: false, lives: 0 }));
            onGameOver(gameState.score);
            gameOverTriggered = true; // Set flag
          }
        }
      });
      if (gameOverTriggered) return; // Stop update if game over triggered by downward move
    } else {
      invadersRef.current.forEach((invader) => {
        if (invader.isAlive) {
          invader.x += invaderHorizontalStep;
        }
      });
    }

    // --- Enemy Shooting ---
    // Use fire interval from API if available, else calculate
    const enemyFireIntervalBase = levelConfig.enemyFireInterval || 1200;
    const enemyFireInterval = Math.max(300, enemyFireIntervalBase - level * 25);

    if (
      now - lastEnemyFireTime.current > enemyFireInterval &&
      activeInvaders.length > 0
    ) {
      const shooters: Invader[] = [];
      const columns: Record<number, Invader[]> = {};
      activeInvaders.forEach((invader) => {
        const colKey = Math.round(invader.x / (invader.width + 10));
        if (!columns[colKey]) columns[colKey] = [];
        columns[colKey].push(invader);
      });
      Object.values(columns).forEach((invadersInCol) => {
        if (invadersInCol.length > 0) {
          shooters.push(
            invadersInCol.reduce((bottom, current) =>
              current.y > bottom.y ? current : bottom
            )
          );
        }
      });

      if (shooters.length > 0) {
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        enemyLasersRef.current.push({
          x: shooter.x + shooter.width / 2 - 2,
          y: shooter.y + shooter.height,
          width: 4,
          height: 16,
          speed: 5,
        });
        lastEnemyFireTime.current = now;
      }
    }

    // --- Update Enemy Lasers ---
    enemyLasersRef.current = enemyLasersRef.current.filter((laser) => {
      laser.y += laser.speed;

      // NO block collision for enemy lasers

      // Player collision
      const hitPlayer =
        gameState.isPlaying &&
        laser.x < player.x + player.width &&
        laser.x + laser.width > player.x &&
        laser.y < player.y + player.height &&
        laser.y + laser.height > player.y;

      if (hitPlayer) {
        setGameState((prev) => {
          if (!prev.isPlaying) return prev; // Already game over
          const newLives = prev.lives - 1;
          explosionsRef.current.push({
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height,
            frame: 0,
            maxFrames: 10,
          });
          if (newLives <= 0) {
            console.log("Game Over - Player hit, no lives left");
            onGameOver(prev.score);
            return { ...prev, lives: 0, isPlaying: false };
          } else {
            toast({
              title: "Player Hit!",
              description: `${newLives} lives remaining.`,
            });
            return { ...prev, lives: newLives };
          }
        });
        return false; // Laser destroyed
      }
      return laser.y < gameHeight;
    });

    // --- Update Explosions ---
    explosionsRef.current = explosionsRef.current.filter((explosion) => {
      explosion.frame++;
      return explosion.frame < explosion.maxFrames;
    });
  }, [
    gameState.isPlaying,
    gameState.isPaused,
    gameState.lives,
    gameState.score,
    player,
    level,
    levelConfig,
    settings.difficulty,
    onGameOver,
    onLevelComplete,
    toast,
  ]);

  // --- Game Rendering Logic (Add background) ---
  const renderGame = useCallback(() => {
    if (!gameRef.current || isLoading) return; // Still need loading check here

    const container = gameRef.current;

    // Clear previous frame's elements
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // --- RENDER ELEMENTS (Player, Blocks, Invaders, Lasers, Explosions) ---
    // (Keep the rendering logic for these elements as in the previous version)
    // ... (render player if alive) ...
    if (
      gameState.lives > 0 &&
      gameState.isPlaying &&
      playerShipImgRef.current
    ) {
      const playerElement = document.createElement("div");
      playerElement.style.position = "absolute";
      playerElement.style.left = `${player.x}px`;
      playerElement.style.top = `${player.y}px`;
      playerElement.style.width = `${player.width}px`;
      playerElement.style.height = `${player.height}px`;
      playerElement.style.backgroundImage = `url(${playerShipImgRef.current.src})`;
      playerElement.style.backgroundSize = "contain";
      playerElement.style.backgroundRepeat = "no-repeat";
      playerElement.style.zIndex = "10"; // Ensure player is above background
      container.appendChild(playerElement);
    }

    // ... (render blocks with health) ...
    blocksRef.current.forEach((block) => {
      if (block.health <= 0) return;
      const blockElement = document.createElement("div");
      blockElement.style.position = "absolute";
      blockElement.style.left = `${block.x}px`;
      blockElement.style.top = `${block.y}px`;
      blockElement.style.width = `${block.width}px`;
      blockElement.style.height = `${block.height}px`;

      if (boxTemplateImgRef.current) {
        blockElement.style.backgroundImage = `url(${boxTemplateImgRef.current.src})`;
        blockElement.style.backgroundSize = "contain";
        blockElement.style.backgroundRepeat = "no-repeat";
        blockElement.style.opacity = String(block.health / 3); // Fade based on health
      }

      blockElement.style.zIndex = "5";
      container.appendChild(blockElement);
    });

    // ... (render invaders) ...
    invadersRef.current.forEach((invader) => {
      if (!invader.isAlive) return;
      const invaderElement = document.createElement("div");
      invaderElement.style.position = "absolute";
      invaderElement.style.left = `${invader.x}px`;
      invaderElement.style.top = `${invader.y}px`;
      invaderElement.style.width = `${invader.width}px`;
      invaderElement.style.height = `${invader.height}px`;
      let imgRef: React.MutableRefObject<HTMLImageElement | null>;
      switch (invader.type) {
        case 0:
          imgRef = invader1ImgRef;
          break;
        case 1:
          imgRef = invader2ImgRef;
          break;
        case 2:
          imgRef = invader3ImgRef;
          break;
        default:
          imgRef = invader1ImgRef;
      }
      if (imgRef.current) {
        invaderElement.style.backgroundImage = `url(${imgRef.current.src})`;
        invaderElement.style.backgroundSize = "contain";
        invaderElement.style.backgroundRepeat = "no-repeat";
        invaderElement.style.zIndex = "5";
        container.appendChild(invaderElement);
      }
    });

    // ... (render player lasers) ...
    playerLasersRef.current.forEach((laser) => {
      const laserElement = document.createElement("div");
      laserElement.style.position = "absolute";
      laserElement.style.left = `${laser.x}px`;
      laserElement.style.top = `${laser.y}px`;
      laserElement.style.width = `${laser.width}px`;
      laserElement.style.height = `${laser.height}px`;
      laserElement.style.backgroundColor = "#00FFFF";
      laserElement.style.boxShadow = "0 0 5px #00FFFF";
      laserElement.style.zIndex = "8";
      container.appendChild(laserElement);
    });

    // ... (render enemy lasers) ...
    enemyLasersRef.current.forEach((laser) => {
      const laserElement = document.createElement("div");
      laserElement.style.position = "absolute";
      laserElement.style.left = `${laser.x}px`;
      laserElement.style.top = `${laser.y}px`;
      laserElement.style.width = `${laser.width}px`;
      laserElement.style.height = `${laser.height}px`;
      laserElement.style.backgroundColor = "#FFFF00";
      laserElement.style.boxShadow = "0 0 5px #FFFF00";
      laserElement.style.zIndex = "8";
      container.appendChild(laserElement);
    });

    explosionsRef.current.forEach((explosion) => {
      if (!explosionImgRef.current) return;
      const explosionElement = document.createElement("div");
      explosionElement.style.position = "absolute";
      explosionElement.style.left = `${explosion.x}px`;
      explosionElement.style.top = `${explosion.y}px`;
      explosionElement.style.width = `${explosion.width}px`;
      explosionElement.style.height = `${explosion.height}px`;
      explosionElement.style.backgroundImage = `url(${explosionImgRef.current.src})`;
      explosionElement.style.backgroundSize = "contain";
      explosionElement.style.backgroundRepeat = "no-repeat";
      explosionElement.style.backgroundPosition = "center";
      explosionElement.style.opacity = String(
        1 - explosion.frame / explosion.maxFrames
      );
      explosionElement.style.transform = `scale(${
        1 + (explosion.frame / explosion.maxFrames) * 0.5
      })`;
      explosionElement.style.pointerEvents = "none";
      explosionElement.style.zIndex = "20"; // Explosions on top
      container.appendChild(explosionElement);
    });
  }, [isLoading, gameState.isPlaying, gameState.lives, player, levelConfig]); // Dependencies

  useEffect(() => {
    let isActive = true;
    const gameLoop = () => {
      if (!isActive || !gameState.isPlaying || gameState.isPaused) return;
      updateGame();
      renderGame();
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    if (gameState.isPlaying && !gameState.isPaused && !isLoading) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(animationFrameId.current);
    }
    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [
    gameState.isPlaying,
    gameState.isPaused,
    isLoading,
    updateGame,
    renderGame,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (gameState.isPlaying) {
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
        }
        return;
      }
      if (!gameState.isPlaying || gameState.isPaused) return;
      keysPressed.current.add(
        e.key.toLowerCase() === " " ? " " : e.key.toLowerCase()
      ); // Handle spacebar specifically
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(
        e.key.toLowerCase() === " " ? " " : e.key.toLowerCase()
      );
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      keysPressed.current.clear();
    };
  }, [gameState.isPlaying, gameState.isPaused]);

  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current && gameState.isPlaying) {
        const gameWidth = gameRef.current.clientWidth; // Recalculate if needed
        const gameHeight = gameRef.current.clientHeight;
        setPlayer((prev) => ({
          ...prev,
          x: Math.min(prev.x, gameWidth - prev.width),
          y: gameHeight - prev.height - 20,
        }));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gameState.isPlaying]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameId.current);
      if (apiAbortController.current) {
        apiAbortController.current.abort(); // Cancel fetch on unmount
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative border-4 border-gray-700 shadow-lg bg-black">
        {" "}
        <div
          ref={gameRef}
          className="game-container relative overflow-hidden outline-none"
          style={{
            width: `${GAME_WIDTH}px`,
            height: `${GAME_HEIGHT}px`,
            backgroundImage: backgroundImageSrc
              ? `url(${backgroundImageSrc})`
              : "none", // Apply fetched background
            backgroundSize: "cover", // Or 'contain'
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated", // Keep pixelated look if desired
            backgroundColor: "#000000", // Fallback background
          }}
          tabIndex={0}
        >
          {/* Overlays */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
              <div className="text-2xl font-mono text-green-400 animate-pulse">
                {isApiLoading ? "GENERATING LEVEL..." : "LOADING ASSETS..."}
              </div>
            </div>
          )}
          {!isLoading && gameState.isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-20">
              {/* Pause Menu unchanged */}
              <div className="text-center p-8 bg-gray-800 border border-blue-500 rounded shadow-xl">
                <h2 className="text-4xl font-mono text-blue-400 mb-6 tracking-widest">
                  PAUSED
                </h2>
                <p className="text-white mb-4 font-mono text-sm">
                  Press ESC to Resume
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <button /* Resume */
                    className="px-5 py-2 bg-green-600 border border-green-400 text-white rounded hover:bg-green-500 font-mono focus:outline-none focus:ring-2 focus:ring-green-300"
                    onClick={() =>
                      setGameState((prev) => ({ ...prev, isPaused: false }))
                    }
                  >
                    {" "}
                    Resume{" "}
                  </button>
                  <button /* Quit */
                    className="px-5 py-2 bg-red-700 border border-red-500 text-white rounded hover:bg-red-600 font-mono focus:outline-none focus:ring-2 focus:ring-red-400"
                    onClick={() => {
                      setGameState((prev) => ({
                        ...prev,
                        isPlaying: false,
                        isPaused: false,
                      }));
                      onGameOver(gameState.score);
                    }}
                  >
                    {" "}
                    Quit{" "}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Render game elements inside here via renderGame function */}
        </div>
      </div>

      {/* UI Below Game Area */}
      <div
        className="flex justify-between mt-4 px-2"
        style={{ width: `${GAME_WIDTH}px` }}
      >
        {" "}
        {/* Match width */}
        <div className="text-lg font-mono text-green-400">
          {" "}
          SCORE: <span className="text-white">{gameState.score}</span>{" "}
        </div>
        <div className="text-lg font-mono text-yellow-400">
          {" "}
          LEVEL: <span className="text-white">{level}</span>{" "}
        </div>
        <div className="text-lg font-mono text-red-400">
          {" "}
          LIVES: <span className="text-white">{gameState.lives}</span>{" "}
        </div>
      </div>

      {/* Pause Button */}
      <div className="mt-4">
        {!isLoading && gameState.isPlaying && (
          <button
            className="px-6 py-2 bg-gray-700 border border-gray-500 text-white rounded hover:bg-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-gray-400"
            onClick={() =>
              setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
            }
          >
            {" "}
            {gameState.isPaused ? "Resume" : "Pause"} (ESC){" "}
          </button>
        )}
      </div>
    </div>
  );
};

export default GameEngine;
