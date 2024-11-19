// Set up the canvas for full-screen
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 800;
const canvasWidth = 800;
const canvasHeight = 800;

// Preload images
const background = new Image();
background.src = "assets/background.png"; // Replace with the correct background path

const spaceshipImage = new Image();
spaceshipImage.src = "assets/ship.png"; // Replace with the correct spaceship path

const alienImage = new Image();
alienImage.src = "assets/alien.png"; // Replace with the correct alien path

const shieldImage = new Image();
shieldImage.src = "assets/shield.png"; // Replace with the correct shield path

const laserImage = new Image();
laserImage.src = "assets/laser.png"; // Replace with the correct laser path

// Player spaceship
const spaceship = {
  x: canvasWidth / 2 - 25,
  y: canvasHeight - 70,
  width: 50,
  height: 50,
  speed: 10,
  dx: 0, // Direction (left/right)
};

// Lasers fired by the player
const lasers = [];

// Shield positions (randomized)
const shields = [];
const shieldCount = 5;
for (let i = 0; i < shieldCount; i++) {
  shields.push({
    x: Math.random() * (canvasWidth - 50), // Random x within canvas
    y: Math.random() * (canvasHeight / 2) + canvasHeight / 2, // Lower half
  });
}

// Aliens (increased count and speed)
const aliens = [];
const alienRowCount = 4;
const alienColumnCount = 10; // More aliens
const alienSpeed = 3; // Faster aliens

for (let row = 0; row < alienRowCount; row++) {
  for (let col = 0; col < alienColumnCount; col++) {
    aliens.push({
      x: col * 70 + 50,
      y: row * 50 + 30,
      width: 40,
      height: 40,
      dx: alienSpeed,
      dy: 0,
    });
  }
}

// Track game over state
let gameOver = false;

// Draw the "Game Over" message
function drawGameOver() {
  ctx.fillStyle = "white";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 2);
}

// Draw the spaceship
function drawSpaceship() {
  ctx.drawImage(
    spaceshipImage,
    spaceship.x,
    spaceship.y,
    spaceship.width,
    spaceship.height
  );
}

// Update spaceship position

function updateSpaceship() {
  const newX = spaceship.x + spaceship.dx;

  // Check for collision with shields
  let isCollidingWithShield = false;
  for (let shield of shields) {
    if (
      newX < shield.x + 50 && // Shield width
      newX + spaceship.width > shield.x &&
      spaceship.y < shield.y + 30 && // Shield height
      spaceship.y + spaceship.height > shield.y
    ) {
      isCollidingWithShield = true;
      break; // Exit the loop early if a collision is detected
    }
  }

  // Only update spaceship position if no collision is detected
  if (!isCollidingWithShield) {
    spaceship.x = newX;

    // Prevent moving outside canvas
    if (spaceship.x < 0) spaceship.x = 0;
    if (spaceship.x + spaceship.width > canvasWidth)
      spaceship.x = canvasWidth - spaceship.width;
  }
}

// Move lasers
function moveLasers() {
  lasers.forEach((laser, index) => {
    laser.y -= laser.speed;

    // Remove laser if it moves out of the canvas
    if (laser.y + laser.height < 0) {
      lasers.splice(index, 1);
    }
  });
}

// Draw lasers
function drawLasers() {
  lasers.forEach((laser) => {
    ctx.drawImage(laserImage, laser.x, laser.y, laser.width, laser.height);
  });
}

// Fire laser
function fireLaser() {
  if (lasers.length < 5) {
    // Limit number of lasers
    lasers.push({
      x: spaceship.x + spaceship.width / 2 - 5, // Centered on the spaceship
      y: spaceship.y - 10,
      width: 10,
      height: 30,
      speed: 8,
    });
  }
}

// Move aliens and handle their behavior
let alienSpeedIncrement = 0.05; // Speed increment for each loop iteration
let alienBaseSpeed = 3; // Initial alien speed

// Move aliens and handle their behavior
// Move aliens and handle their behavior with shield collision check
function moveAliens() {
  if (aliens.length === 0) {
    gameOver = true;
    return;
  }

  for (let alien of aliens) {
    let canMove = true; // Flag to check if alien can move

    // Check for collision with shields
    for (let shield of shields) {
      if (
        alien.x < shield.x + 50 && // Shield width
        alien.x + alien.width > shield.x &&
        alien.y < shield.y + 30 && // Shield height
        alien.y + alien.height > shield.y
      ) {
        canMove = false; // Stop alien from moving if it collides with shield
        break;
      }
    }

    if (canMove) {
      alien.x += alien.dx; // Move the alien if no collision is detected
    } else {
      // If the alien is blocked by a shield, reverse direction
      alien.dx *= -1;
      alien.y += 30; // Move closer to the player
    }

    // Reverse direction when hitting canvas edge
    if (alien.x <= 0 || alien.x + alien.width >= canvasWidth) {
      alien.dx *= -1;
      alien.y += 30; // Move closer to the player
    }

    // Gradually increase alien speed
    alien.dx =
      alien.dx > 0
        ? alienBaseSpeed + alienSpeedIncrement
        : -(alienBaseSpeed + alienSpeedIncrement);

    // Check for collision between alien and spaceship (game over scenario)
    if (
      alien.x < spaceship.x + spaceship.width &&
      alien.x + alien.width > spaceship.x &&
      alien.y < spaceship.y + spaceship.height &&
      alien.y + alien.height > spaceship.y
    ) {
      gameOver = true;
      return; // Stop the loop if the spaceship is touched by an alien
    }

    // Check if aliens reach the bottom (game over scenario)
    if (alien.y + alien.height >= canvasHeight) {
      gameOver = true;
      return;
    }
  }

  // Gradually increase base speed
  alienBaseSpeed += alienSpeedIncrement / 100;
}

// Draw aliens
function drawAliens() {
  aliens.forEach((alien) => {
    ctx.drawImage(alienImage, alien.x, alien.y, alien.width, alien.height);
  });
}

// Handle collisions between lasers and other objects
function handleCollisions() {
  // Check for collisions between lasers and aliens
  lasers.forEach((laser, laserIndex) => {
    aliens.forEach((alien, alienIndex) => {
      if (
        laser.x < alien.x + alien.width &&
        laser.x + laser.width > alien.x &&
        laser.y < alien.y + alien.height &&
        laser.y + laser.height > alien.y
      ) {
        // Remove the laser and alien on collision
        lasers.splice(laserIndex, 1);
        aliens.splice(alienIndex, 1);
      }
    });
  });

  // Check for collisions between lasers and shields
  lasers.forEach((laser, laserIndex) => {
    shields.forEach((shield) => {
      if (
        laser.x < shield.x + 50 && // Shield width is 50
        laser.x + laser.width > shield.x &&
        laser.y < shield.y + 30 && // Shield height is 30
        laser.y + laser.height > shield.y
      ) {
        // Remove the laser if it hits a shield
        lasers.splice(laserIndex, 1);
      }
    });
  });
}

// Draw shields
function drawShields() {
  shields.forEach((shield) => {
    ctx.drawImage(shieldImage, shield.x, shield.y, 50, 30);
  });
}

// Handle player input
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") spaceship.dx = -spaceship.speed;
  if (e.key === "ArrowRight") spaceship.dx = spaceship.speed;
  if (e.key === " ") fireLaser(); // Spacebar to shoot
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") spaceship.dx = 0;
});

// Main game loop
function gameLoop() {
  if (gameOver) {
    drawGameOver();
    return; // Stop the loop
  }

  ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);
  drawSpaceship();
  drawShields();
  drawAliens();
  drawLasers();

  moveLasers();
  moveAliens();
  handleCollisions();
  updateSpaceship();

  requestAnimationFrame(gameLoop);
}

// Start the game loop when all images are loaded
background.onload = () => {
  gameLoop();
};
