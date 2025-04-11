
import React from 'react';
import { motion } from 'framer-motion';

interface LevelCardProps {
  level: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isLocked: boolean;
  isCompleted: boolean;
  highScore: number;
  onClick: () => void;
}

const LevelCard: React.FC<LevelCardProps> = ({
  level,
  title,
  difficulty,
  isLocked,
  isCompleted,
  highScore,
  onClick
}) => {
  const difficultyColor = {
    easy: 'text-green-400',
    medium: 'text-yellow-400',
    hard: 'text-red-400'
  };
  
  const difficultyBg = {
    easy: 'bg-green-400/20',
    medium: 'bg-yellow-400/20',
    hard: 'bg-red-400/20'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`level-card ${isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !isLocked && onClick()}
    >
      <div className="absolute inset-0 flex flex-col p-4">
        <div className="flex justify-between items-start">
          <span className="text-xl font-pixel neon-text">
            {level.toString().padStart(2, '0')}
          </span>
          
          {isCompleted && (
            <span className="bg-space-neon-green/20 text-space-neon-green text-xs px-2 py-1 rounded-full">
              COMPLETED
            </span>
          )}
          
          {isLocked && (
            <span className="bg-space-neon-pink/20 text-space-neon-pink text-xs px-2 py-1 rounded-full">
              LOCKED
            </span>
          )}
        </div>
        
        <div className="mt-auto">
          <h3 className="text-white text-lg font-future">{title}</h3>
          
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${difficultyBg[difficulty]} ${difficultyColor[difficulty]}`}>
              {difficulty.toUpperCase()}
            </span>
            
            {highScore > 0 && (
              <span className="text-xs text-gray-400">
                HIGH SCORE: <span className="text-space-neon-blue">{highScore}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Patterns and decorations */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10 border-t-2 border-r-2 border-space-neon-blue" />
      <div className="absolute bottom-0 left-0 w-10 h-10 opacity-10 border-b-2 border-l-2 border-space-neon-blue" />
    </motion.div>
  );
};

export default LevelCard;
