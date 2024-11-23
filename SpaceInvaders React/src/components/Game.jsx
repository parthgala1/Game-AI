import React, { useEffect, useRef, useState } from "react";

const Game = () => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [hits, setHits] = useState(0);

  const gameStateRef = useRef({
    lasers: [],
    shields: [],
    aliens: [],
    alienLasers: [],
    animationFrameId: null,
    initialized: false,
    lastAlienShotTime: 0,
  });

  const canvasWidth = 800;
  const canvasHeight = 800;

  const spaceship = {
    x: canvasWidth / 2 - 25,
    y: canvasHeight - 70,
    width: 50,
    height: 50,
    speed: 10,
    dx: 0,
  };

  const alienRowCount = 4;
  const alienColumnCount = 10;
  const alienSpeed = 3;
  const ALIEN_SHOT_COOLDOWN = 2000;

  const initializeAliens = () => {
    // Only initialize aliens if they haven't been initialized or if game is being reset
    if (
      !gameStateRef.current.initialized ||
      gameStateRef.current.aliens.length === 0
    ) {
      gameStateRef.current.aliens = [];
      for (let row = 0; row < alienRowCount; row++) {
        for (let col = 0; col < alienColumnCount; col++) {
          gameStateRef.current.aliens.push({
            x: col * 70 + 50,
            y: row * 50 + 30,
            width: 40,
            height: 40,
            dx: alienSpeed,
            dy: 0,
          });
        }
      }
    }
  };

  const initializeShields = () => {
    if (!gameStateRef.current.initialized) {
      // Define static positions for shields (e.g., in a row along the bottom)
      gameStateRef.current.shields = [
        { x: 100, y: canvasHeight - 100, width: 50, height: 30 },
        { x: 200, y: canvasHeight - 100, width: 50, height: 30 },
        { x: 300, y: canvasHeight - 100, width: 50, height: 30 },
        { x: 400, y: canvasHeight - 100, width: 50, height: 30 },
        { x: 500, y: canvasHeight - 100, width: 50, height: 30 },
      ];
      gameStateRef.current.initialized = true;
    }
  };

  // Load images
  const background = new Image();
  background.src = "/assets/background.png";

  const spaceshipImage = new Image();
  spaceshipImage.src = "/assets/ship.png";

  const alienImage = new Image();
  alienImage.src = "/assets/alien.png";

  const shieldImage = new Image();
  shieldImage.src = "/assets/shield.png";

  const laserImage = new Image();
  laserImage.src = "/assets/laser.png";

  const alienLaserImage = new Image();
  alienLaserImage.src = "/assets/alien-laser.png";

  const resetGame = () => {
    spaceship.x = canvasWidth / 2 - 25;
    spaceship.y = canvasHeight - 70;
    spaceship.dx = 0;
    gameStateRef.current.lasers = [];
    gameStateRef.current.alienLasers = [];
    gameStateRef.current.aliens = []; // Clear aliens before reinitializing
    initializeAliens(); // Reinitialize aliens
    setHits(0);
    setGameOver(false);
  };

  const fireAlienLaser = (currentTime) => {
    if (
      currentTime - gameStateRef.current.lastAlienShotTime >=
        ALIEN_SHOT_COOLDOWN &&
      gameStateRef.current.alienLasers.length === 0 &&
      gameStateRef.current.aliens.length > 0
    ) {
      const randomAlien =
        gameStateRef.current.aliens[
          Math.floor(Math.random() * gameStateRef.current.aliens.length)
        ];

      gameStateRef.current.alienLasers.push({
        x: randomAlien.x + randomAlien.width / 2 - 5,
        y: randomAlien.y + randomAlien.height,
        width: 10,
        height: 20,
        speed: 4,
      });

      gameStateRef.current.lastAlienShotTime = currentTime;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!canvas || !ctx) {
      console.error("Canvas or context is not available.");
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") spaceship.dx = -spaceship.speed;
      if (e.key === "ArrowRight") spaceship.dx = spaceship.speed;
      if (e.key === " " && !gameOver) fireLaser();
      if (e.key === "Enter" && gameOver) resetGame();
    };

    const handleKeyUp = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") spaceship.dx = 0;
    };

    const fireLaser = () => {
      if (gameStateRef.current.lasers.length < 5) {
        gameStateRef.current.lasers.push({
          x: spaceship.x + spaceship.width / 2 - 5,
          y: spaceship.y - 10,
          width: 10,
          height: 30,
          speed: 8,
        });
      }
    };

    const drawGameOver = () => {
      ctx.fillStyle = "white";
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 2);
      ctx.font = "24px Arial";
      ctx.fillText(
        "Press ENTER to restart",
        canvasWidth / 2,
        canvasHeight / 2 + 50
      );
    };

    const drawElements = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

      ctx.drawImage(
        spaceshipImage,
        spaceship.x,
        spaceship.y,
        spaceship.width,
        spaceship.height
      );

      gameStateRef.current.shields.forEach((shield) => {
        ctx.drawImage(
          shieldImage,
          shield.x,
          shield.y,
          shield.width,
          shield.height
        );
      });

      gameStateRef.current.aliens.forEach((alien) => {
        ctx.drawImage(alienImage, alien.x, alien.y, alien.width, alien.height);
      });

      gameStateRef.current.lasers.forEach((laser) => {
        ctx.drawImage(laserImage, laser.x, laser.y, laser.width, laser.height);
      });

      gameStateRef.current.alienLasers.forEach((laser) => {
        ctx.drawImage(
          alienLaserImage,
          laser.x,
          laser.y,
          laser.width,
          laser.height
        );
      });

      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Hits: ${hits}/4`, 10, 30);
    };

    const updateGame = () => {
      spaceship.x += spaceship.dx;
      spaceship.x = Math.max(
        0,
        Math.min(canvasWidth - spaceship.width, spaceship.x)
      );

      gameStateRef.current.lasers = gameStateRef.current.lasers.filter(
        (laser) => {
          laser.y -= laser.speed;
          return laser.y + laser.height >= 0;
        }
      );

      gameStateRef.current.alienLasers =
        gameStateRef.current.alienLasers.filter((laser) => {
          laser.y += laser.speed;
          return laser.y <= canvasHeight;
        });

      gameStateRef.current.aliens.forEach((alien) => {
        alien.x += alien.dx;
        if (alien.x <= 0 || alien.x + alien.width >= canvasWidth) {
          alien.dx *= -1;
          alien.y += 30;
        }
      });
    };

    const checkCollisions = () => {
      // Check player laser hits on aliens
      gameStateRef.current.lasers = gameStateRef.current.lasers.filter(
        (laser) => {
          const hitAlien = gameStateRef.current.aliens.findIndex(
            (alien) =>
              laser.x < alien.x + alien.width &&
              laser.x + laser.width > alien.x &&
              laser.y < alien.y + alien.height &&
              laser.y + laser.height > alien.y
          );

          if (hitAlien !== -1) {
            gameStateRef.current.aliens.splice(hitAlien, 1);
            return false;
          }
          return true;
        }
      );

      // Check laser hits on shields
      gameStateRef.current.lasers = gameStateRef.current.lasers.filter(
        (laser) => {
          const hitShield = gameStateRef.current.shields.some(
            (shield) =>
              laser.x < shield.x + shield.width &&
              laser.x + laser.width > shield.x &&
              laser.y < shield.y + shield.height &&
              laser.y + laser.height > shield.y
          );
          return !hitShield;
        }
      );

      // Check alien laser hits on shields
      gameStateRef.current.alienLasers =
        gameStateRef.current.alienLasers.filter((laser) => {
          const hitShield = gameStateRef.current.shields.some(
            (shield) =>
              laser.x < shield.x + shield.width &&
              laser.x + laser.width > shield.x &&
              laser.y < shield.y + shield.height &&
              laser.y + laser.height > shield.y
          );
          return !hitShield;
        });

      // Check alien laser hits on spaceship
      gameStateRef.current.alienLasers =
        gameStateRef.current.alienLasers.filter((laser) => {
          if (
            laser.x < spaceship.x + spaceship.width &&
            laser.x + laser.width > spaceship.x &&
            laser.y < spaceship.y + spaceship.height &&
            laser.y + laser.height > spaceship.y
          ) {
            setHits((prevHits) => {
              const newHits = prevHits + 1;
              if (newHits >= 4) {
                setGameOver(true);
              }
              return newHits;
            });
            return false;
          }
          return true;
        });

      // Check alien collision with spaceship
      if (
        gameStateRef.current.aliens.some(
          (alien) =>
            alien.x < spaceship.x + spaceship.width &&
            alien.x + alien.width > spaceship.x &&
            alien.y < spaceship.y + spaceship.height &&
            alien.y + alien.height > spaceship.y
        )
      ) {
        setGameOver(true);
      }

      // Check for victory (all aliens destroyed)
      if (gameStateRef.current.aliens.length === 0) {
        setGameOver(true);
      }
    };

    const gameLoop = () => {
      const currentTime = Date.now();

      if (!gameOver) {
        updateGame();
        fireAlienLaser(currentTime);
        checkCollisions();
        drawElements();
        gameStateRef.current.animationFrameId = requestAnimationFrame(gameLoop);
      } else {
        drawElements();
        drawGameOver();
      }
    };

    // Initialize game only once at the start
    if (!gameStateRef.current.initialized) {
      initializeShields();
      initializeAliens();
      gameStateRef.current.lastAlienShotTime = Date.now();
    }

    // Set up event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Start game loop
    gameLoop();

    // Cleanup function
    return () => {
      if (gameStateRef.current.animationFrameId) {
        cancelAnimationFrame(gameStateRef.current.animationFrameId);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver, hits]);

  return <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />;
};

export default Game;
