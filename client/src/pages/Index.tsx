import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gamepad, Zap, Layers, Settings } from "lucide-react";
import Layout from "../components/Layout";
import NeonButton from "../components/NeonButton";
import game_preview from "../assets/game_preview.png";

const Index = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-pixel tracking-wide neon-text mb-4">
            SPACE INVADERS
          </h1>
          <h2 className="text-2xl md:text-3xl font-future neon-pink-text mb-6">
            Welcome to the Future
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Experience the classic arcade game reimagined with modern AI
            technology. Our GAN-powered level generator creates unique
            challenges tailored to your skill level.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/game">
              <NeonButton color="green" size="lg" icon={<Gamepad />}>
                Play Now
              </NeonButton>
            </Link>
            <Link to="/levels">
              <NeonButton color="blue" size="lg" icon={<Layers />}>
                Browse Levels
              </NeonButton>
            </Link>
          </div>
        </motion.div>

        {/* Game Screenshot Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-20"
        >
          <div className="relative w-[800px] h-[800px] mx-auto game-container overflow-hidden">
            <div className="absolute inset-0 bg-space-dark flex items-center justify-center">
              <img
                src={game_preview}
                alt="Game Screenshot"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-future neon-text text-center mb-10">
            GAME FEATURES
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap size={24} className="text-space-neon-green" />}
              title="AI-Generated Levels"
              description="Our GAN technology creates unique levels tailored to your skill level, ensuring a fresh experience every time."
            />

            <FeatureCard
              icon={<Gamepad size={24} className="text-space-neon-pink" />}
              title="Classic Gameplay"
              description="Experience the nostalgia of classic Space Invaders with modern enhancements and visual effects."
            />

            <FeatureCard
              icon={<Settings size={24} className="text-space-neon-blue" />}
              title="Customizable Experience"
              description="Adjust difficulty, visual effects, and sounds to create your perfect gameplay experience."
            />

            <FeatureCard
              icon={<Layers size={24} className="text-space-neon-purple" />}
              title="Level Progression"
              description="Progress through increasingly challenging levels, each with unique enemy patterns and behaviors."
            />

            <FeatureCard
              icon={<Zap size={24} className="text-space-neon-green" />}
              title="Adaptive Difficulty"
              description="The game learns from your performance to provide the perfect balance of challenge and reward."
            />

            <FeatureCard
              icon={<Gamepad size={24} className="text-space-neon-pink" />}
              title="Score Tracking"
              description="Compete with yourself and others by tracking high scores across all game levels."
            />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0, 255, 170, 0.1)" }}
      className="bg-space-medium/20 border border-space-neon-green/30 rounded-lg p-6 transition-all duration-300"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-future text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
};

export default Index;
