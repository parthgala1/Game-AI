import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, RotateCcw, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import GameEngine from "../components/GameEngine";
import NeonButton from "../components/NeonButton";

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    difficulty: "medium",
    particleEffects: true,
  });

  // Extract level from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const levelParam = queryParams.get("level");

    if (levelParam) {
      const levelId = parseInt(levelParam, 10);
      if (!isNaN(levelId)) {
        setCurrentLevel(levelId);
      }
    }
  }, [location.search]);

  const handleStartGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setLevelComplete(false);
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameOver(true);
    setIsPlaying(false);
  };

  const handleLevelComplete = (score: number) => {
    setFinalScore(score);
    setLevelComplete(true);
    setIsPlaying(false);
  };

  const handleNextLevel = () => {
    setCurrentLevel((prev) => prev + 1);
    setIsPlaying(true);
    setLevelComplete(false);
  };

  const handleRestartLevel = () => {
    setIsPlaying(true);
    setGameOver(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {!isPlaying && !gameOver && !levelComplete ? (
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-pixel neon-text mb-6">
              {currentLevel === 1 ? "READY TO PLAY?" : `LEVEL ${currentLevel}`}
            </h1>

            <div className="bg-space-medium/30 border border-space-neon-green/30 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-future text-white mb-4">
                Level {currentLevel} Briefing
              </h2>
              <p className="text-gray-300 mb-4">
                {currentLevel === 1
                  ? "Welcome to your first mission! Alien invaders are approaching Earth, and you're our last line of defense. Use your ship to eliminate the threat before they reach our planet."
                  : `The aliens have regrouped with reinforced formations. Level ${currentLevel} features more aggressive enemies and tighter formations. Stay alert and protect Earth at all costs!`}
              </p>

              <div className="text-left text-sm text-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-future text-space-neon-blue mb-1">
                      Controls:
                    </h3>
                    <ul className="list-disc list-inside">
                      <li>Arrow keys or A/D to move</li>
                      <li>Space to shoot</li>
                      <li>ESC to pause</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-future text-space-neon-pink mb-1">
                      Objective:
                    </h3>
                    <ul className="list-disc list-inside">
                      <li>Destroy all aliens</li>
                      <li>Avoid enemy lasers</li>
                      <li>Survive to advance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <NeonButton color="green" onClick={handleStartGame}>
                Start Level {currentLevel}
              </NeonButton>
              <NeonButton
                color="blue"
                variant="outline"
                onClick={() => navigate("/levels")}
              >
                Choose Different Level
              </NeonButton>
              <NeonButton
                color="pink"
                variant="ghost"
                onClick={() => navigate("/")}
              >
                <Home size={18} />
                Back to Home
              </NeonButton>
            </div>
          </div>
        ) : gameOver ? (
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-pixel neon-pink-text mb-6">
              GAME OVER
            </h1>

            <div className="bg-space-medium/30 border border-space-neon-pink/30 rounded-lg p-6 mb-8">
              <p className="text-xl text-white mb-4">
                The aliens have reached Earth! Your final score was:
              </p>
              <p className="text-3xl font-future neon-text mb-6">
                {finalScore}
              </p>

              <p className="text-gray-400 mb-2">
                Don't give up! Earth is counting on you.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <NeonButton
                color="green"
                onClick={handleRestartLevel}
                icon={<RotateCcw size={18} />}
              >
                Try Again
              </NeonButton>
              <NeonButton
                color="blue"
                variant="outline"
                onClick={() => navigate("/levels")}
              >
                Choose Different Level
              </NeonButton>
              <NeonButton
                color="pink"
                variant="ghost"
                onClick={() => navigate("/")}
              >
                <Home size={18} />
                Back to Home
              </NeonButton>
            </div>
          </div>
        ) : levelComplete ? (
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-pixel neon-text mb-6">
              LEVEL COMPLETE!
            </h1>

            <div className="bg-space-medium/30 border border-space-neon-green/30 rounded-lg p-6 mb-8">
              <p className="text-xl text-white mb-4">
                Congratulations! You've completed Level {currentLevel}.
              </p>
              <p className="text-3xl font-future neon-text mb-6">
                Score: {finalScore}
              </p>

              <p className="text-gray-400 mb-2">
                But the alien invasion continues. Are you ready for the next
                challenge?
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <NeonButton
                color="green"
                onClick={handleNextLevel}
                icon={<ArrowRight size={18} />}
              >
                Next Level
              </NeonButton>
              <NeonButton
                color="blue"
                variant="outline"
                onClick={() => navigate("/levels")}
              >
                Choose Different Level
              </NeonButton>
              <NeonButton
                color="pink"
                variant="ghost"
                onClick={() => navigate("/")}
              >
                <Home size={18} />
                Back to Home
              </NeonButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <GameEngine
              level={currentLevel}
              onGameOver={handleGameOver}
              onLevelComplete={handleLevelComplete}
              settings={settings}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Game;
