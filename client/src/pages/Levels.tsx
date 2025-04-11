
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import LevelCard from '../components/LevelCard';
import NeonButton from '../components/NeonButton';
import { Gamepad, RefreshCw } from 'lucide-react';

const Levels = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'standard' | 'generated'>('all');
  
  // Mock level data - in a real app, this would come from a database
  const levels = [
    {
      id: 1,
      level: 1,
      title: "First Contact",
      difficulty: "easy" as const,
      isLocked: false,
      isCompleted: true,
      highScore: 1250,
      category: "standard"
    },
    {
      id: 2,
      level: 2,
      title: "Orbital Defense",
      difficulty: "easy" as const,
      isLocked: false,
      isCompleted: false,
      highScore: 0,
      category: "standard"
    },
    {
      id: 3,
      level: 3,
      title: "Lunar Assault",
      difficulty: "medium" as const,
      isLocked: true,
      isCompleted: false,
      highScore: 0,
      category: "standard"
    },
    {
      id: 4,
      level: 4,
      title: "Martian Mayhem",
      difficulty: "medium" as const,
      isLocked: true,
      isCompleted: false,
      highScore: 0,
      category: "standard"
    },
    {
      id: 5,
      level: 5,
      title: "Asteroid Ambush",
      difficulty: "hard" as const,
      isLocked: true,
      isCompleted: false,
      highScore: 0,
      category: "standard"
    },
    {
      id: 101,
      level: "G1",
      title: "Neural Network Alpha",
      difficulty: "medium" as const,
      isLocked: false,
      isCompleted: false,
      highScore: 850,
      category: "generated"
    },
    {
      id: 102,
      level: "G2",
      title: "Procedural Beta",
      difficulty: "hard" as const,
      isLocked: false,
      isCompleted: false,
      highScore: 0,
      category: "generated"
    }
  ];

  const handleLevelSelect = (level: { 
    id: number,
    level: string | number, 
    isLocked: boolean 
  }) => {
    if (level.isLocked) return;
    
    // Always use the numeric id for navigation
    navigate(`/game?level=${level.id}`);
  };

  const filteredLevels = levels.filter(level => {
    if (selectedCategory === 'all') return true;
    return level.category === selectedCategory;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-pixel neon-text mb-6">
            SELECT LEVEL
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Choose from standard campaign levels or try our AI-generated levels for a unique challenge.
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <button
              className={`px-4 py-2 rounded-md font-future transition-all ${
                selectedCategory === 'all' 
                  ? 'bg-space-neon-green/20 text-space-neon-green border border-space-neon-green/50' 
                  : 'bg-space-medium/30 text-gray-400 hover:text-white'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              All Levels
            </button>
            <button
              className={`px-4 py-2 rounded-md font-future transition-all ${
                selectedCategory === 'standard' 
                  ? 'bg-space-neon-blue/20 text-space-neon-blue border border-space-neon-blue/50' 
                  : 'bg-space-medium/30 text-gray-400 hover:text-white'
              }`}
              onClick={() => setSelectedCategory('standard')}
            >
              Campaign
            </button>
            <button
              className={`px-4 py-2 rounded-md font-future transition-all ${
                selectedCategory === 'generated' 
                  ? 'bg-space-neon-pink/20 text-space-neon-pink border border-space-neon-pink/50' 
                  : 'bg-space-medium/30 text-gray-400 hover:text-white'
              }`}
              onClick={() => setSelectedCategory('generated')}
            >
              AI Generated
            </button>
          </div>
          
          {selectedCategory === 'generated' && (
            <div className="mb-8">
              <NeonButton 
                color="pink" 
                icon={<RefreshCw size={18} />}
                onClick={() => {
                  // In a real app, this would trigger the GAN to generate a new level
                  alert("In a full implementation, this would generate a new level using the GAN!");
                }}
              >
                Generate New Level
              </NeonButton>
              <p className="text-xs text-gray-500 mt-2">
                Note: GAN-generated levels are simulated in this demo
              </p>
            </div>
          )}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLevels.map((level) => (
              <LevelCard
                key={level.id}
                level={level.level}
                title={level.title}
                difficulty={level.difficulty}
                isLocked={level.isLocked}
                isCompleted={level.isCompleted}
                highScore={level.highScore}
                onClick={() => handleLevelSelect(level)}
              />
            ))}
          </div>
          
          {filteredLevels.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">No levels available in this category.</p>
            </div>
          )}
        </motion.div>
        
        <div className="mt-10 text-center">
          <NeonButton color="green" icon={<Gamepad size={18} />} onClick={() => navigate('/game')}>
            Play Latest Level
          </NeonButton>
        </div>
      </div>
    </Layout>
  );
};

export default Levels;
