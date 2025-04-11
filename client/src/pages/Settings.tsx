
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Zap, ZapOff, BarChart4, Save } from 'lucide-react';
import Layout from '../components/Layout';
import NeonButton from '../components/NeonButton';
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "../hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    masterVolume: 80,
    sfxVolume: 90,
    musicVolume: 70,
    soundEnabled: true,
    difficulty: 'medium',
    particleEffects: true,
    screenShake: true,
    highContrast: false,
    pixelatedRendering: true,
    showFPS: false,
  });
  
  const handleSaveSettings = () => {
    // In a real app, this would save to localStorage or a database
    toast({
      title: "Settings Saved",
      description: "Your game preferences have been updated.",
      duration: 3000,
    });
    
    // For demo, we'll just log the settings
    console.log("Saved settings:", settings);
  };
  
  const handleResetDefaults = () => {
    setSettings({
      masterVolume: 80,
      sfxVolume: 90,
      musicVolume: 70,
      soundEnabled: true,
      difficulty: 'medium',
      particleEffects: true,
      screenShake: true,
      highContrast: false,
      pixelatedRendering: true,
      showFPS: false,
    });
    
    toast({
      title: "Settings Reset",
      description: "All settings have been restored to defaults.",
      duration: 3000,
    });
  };

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
            SETTINGS
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            Customize your gameplay experience with these options.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-space-medium/30 border border-space-neon-green/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-future neon-text mb-6">Audio Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2 size={20} className="text-space-neon-green" /> : <VolumeX size={20} className="text-space-neon-pink" />}
                  <Label htmlFor="sound-toggle">Sound Effects</Label>
                </div>
                <Switch 
                  id="sound-toggle"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, soundEnabled: checked }))}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Master Volume</Label>
                  <span className="text-gray-400">{settings.masterVolume}%</span>
                </div>
                <Slider 
                  value={[settings.masterVolume]} 
                  min={0} 
                  max={100} 
                  step={1}
                  disabled={!settings.soundEnabled}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, masterVolume: value[0] }))}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>SFX Volume</Label>
                  <span className="text-gray-400">{settings.sfxVolume}%</span>
                </div>
                <Slider 
                  value={[settings.sfxVolume]} 
                  min={0} 
                  max={100} 
                  step={1}
                  disabled={!settings.soundEnabled}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, sfxVolume: value[0] }))}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Music Volume</Label>
                  <span className="text-gray-400">{settings.musicVolume}%</span>
                </div>
                <Slider 
                  value={[settings.musicVolume]} 
                  min={0} 
                  max={100} 
                  step={1}
                  disabled={!settings.soundEnabled}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, musicVolume: value[0] }))}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-space-medium/30 border border-space-neon-blue/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-future neon-blue-text mb-6">Gameplay Settings</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button
                    className={`px-4 py-2 rounded-md transition-all ${
                      settings.difficulty === 'easy' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                        : 'bg-space-medium/50 text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setSettings(prev => ({ ...prev, difficulty: 'easy' }))}
                  >
                    Easy
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md transition-all ${
                      settings.difficulty === 'medium' 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
                        : 'bg-space-medium/50 text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setSettings(prev => ({ ...prev, difficulty: 'medium' }))}
                  >
                    Medium
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md transition-all ${
                      settings.difficulty === 'hard' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                        : 'bg-space-medium/50 text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setSettings(prev => ({ ...prev, difficulty: 'hard' }))}
                  >
                    Hard
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.particleEffects ? <Zap size={20} className="text-space-neon-green" /> : <ZapOff size={20} className="text-gray-400" />}
                  <Label htmlFor="particles-toggle">Particle Effects</Label>
                </div>
                <Switch 
                  id="particles-toggle"
                  checked={settings.particleEffects}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, particleEffects: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="shake-toggle">Screen Shake</Label>
                </div>
                <Switch 
                  id="shake-toggle"
                  checked={settings.screenShake}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, screenShake: checked }))}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-space-medium/30 border border-space-neon-purple/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-future neon-pink-text mb-6">Visual Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="contrast-toggle">High Contrast Mode</Label>
                </div>
                <Switch 
                  id="contrast-toggle"
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, highContrast: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="pixel-toggle">Pixelated Rendering</Label>
                </div>
                <Switch 
                  id="pixel-toggle"
                  checked={settings.pixelatedRendering}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pixelatedRendering: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart4 size={20} className={settings.showFPS ? "text-space-neon-green" : "text-gray-400"} />
                  <Label htmlFor="fps-toggle">Show FPS Counter</Label>
                </div>
                <Switch 
                  id="fps-toggle"
                  checked={settings.showFPS}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showFPS: checked }))}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <NeonButton color="pink" variant="outline" onClick={handleResetDefaults}>
              Reset to Defaults
            </NeonButton>
            <NeonButton color="green" icon={<Save size={18} />} onClick={handleSaveSettings}>
              Save Settings
            </NeonButton>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Settings;
