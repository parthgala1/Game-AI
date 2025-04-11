
import React, { useEffect, useRef } from 'react';

const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Star properties
    interface Star {
      x: number;
      y: number;
      size: number;
      speed: number;
      brightness: number;
      blinkSpeed: number;
      blinkDirection: number;
    }

    // Initialize stars array before using it
    const stars: Star[] = [];
    const STAR_COUNT = Math.floor((window.innerWidth * window.innerHeight) / 5000);

    // Initialize stars
    function initStars() {
      // Clear existing stars
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5,
          speed: Math.random() * 0.05 + 0.01,
          brightness: Math.random() * 0.5 + 0.5,
          blinkSpeed: Math.random() * 0.01,
          blinkDirection: Math.random() > 0.5 ? 1 : -1
        });
      }
    }

    // Resize canvas to match window dimensions
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(); // Reinitialize stars when canvas resizes
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw and update stars
      stars.forEach(star => {
        // Update star brightness (twinkling effect)
        star.brightness += star.blinkSpeed * star.blinkDirection;
        if (star.brightness > 1) {
          star.brightness = 1;
          star.blinkDirection = -1;
        } else if (star.brightness < 0.3) {
          star.brightness = 0.3;
          star.blinkDirection = 1;
        }
        
        // Slow movement from top to bottom
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
        
        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    }
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield" />;
};

export default StarField;
