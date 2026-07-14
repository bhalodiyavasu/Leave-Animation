"use client";

import React, { useState, useEffect } from 'react';
import CharacterScene from '@/components/CharacterScene';
import { useCharacterStore, CharacterAnimation } from '@/store/useCharacterStore';

export default function VoxelDemoPage() {
  // Local state for prop-driven customization
  const [localAnimation, setLocalAnimation] = useState<CharacterAnimation | undefined>(undefined);
  const [characterColor, setCharacterColor] = useState('#3b82f6');
  const [characterScale, setCharacterScale] = useState(1.4);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [controlType, setControlType] = useState<'prop' | 'store'>('prop');

  // Zustand Store variables
  const storeAnimation = useCharacterStore((state) => state.animation);
  const setStoreAnimation = useCharacterStore((state) => state.setAnimation);

  // Mock Chatbot state
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: "Hello! I am Voxie, your 3D assistant. Try typing a message to make me talk, or trigger animations from the control panel!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Synchronize local control state with store for a unified UI representation
  useEffect(() => {
    if (controlType === 'store') {
      setLocalAnimation(undefined); // Let store drive it
    } else {
      setLocalAnimation(storeAnimation); // Seed local with current store animation
    }
  }, [controlType, storeAnimation]);

  // Handle chatbot messaging
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setIsTyping(true);

    // Set animation to 'talk'
    if (controlType === 'store') {
      setStoreAnimation('talk');
    } else {
      setLocalAnimation('talk');
    }

    // Simulate AI response
    setTimeout(() => {
      let botResponse = "I'm processing that event for you!";
      const lower = userMessage.toLowerCase();
      
      if (lower.includes('hello') || lower.includes('hi')) {
        botResponse = "Hi there! Great to meet you! How can I help you today?";
        if (controlType === 'store') setStoreAnimation('wave');
        else setLocalAnimation('wave');
      } else if (lower.includes('walk') || lower.includes('run')) {
        botResponse = "Sure, I can stretch my legs. Let's walk around!";
        if (controlType === 'store') setStoreAnimation('walk');
        else setLocalAnimation('walk');
      } else if (lower.includes('jump') || lower.includes('hop')) {
        botResponse = "Woohoo! Let's get some air!";
        if (controlType === 'store') setStoreAnimation('jump');
        else setLocalAnimation('jump');
      } else if (lower.includes('wave') || lower.includes('hey')) {
        botResponse = "Hey! Look at me waving!";
        if (controlType === 'store') setStoreAnimation('wave');
        else setLocalAnimation('wave');
      } else {
        botResponse = `Interesting question! Let me think... Okay, I've updated my internal registers.`;
      }

      setChatHistory((prev) => [...prev, { sender: 'bot', text: botResponse }]);
      setIsTyping(false);

      // Return to idle/default walk after 4 seconds
      setTimeout(() => {
        if (controlType === 'store') {
          setStoreAnimation('idle');
        } else {
          setLocalAnimation('idle');
        }
      }, 4000);

    }, 1500);
  };

  // Trigger a celebratory deployment workflow
  const triggerWorkflowEvent = (actionType: 'deploy' | 'error' | 'success') => {
    if (actionType === 'deploy') {
      // Simulate build steps then success jump
      if (controlType === 'store') setStoreAnimation('walk');
      else setLocalAnimation('walk');

      setTimeout(() => {
        if (controlType === 'store') setStoreAnimation('jump');
        else setLocalAnimation('jump');
        
        setTimeout(() => {
          if (controlType === 'store') setStoreAnimation('wave');
          else setLocalAnimation('wave');
          
          setTimeout(() => {
            if (controlType === 'store') setStoreAnimation('idle');
            else setLocalAnimation('idle');
          }, 3000);
        }, 2000);
      }, 2000);
    } else if (actionType === 'success') {
      if (controlType === 'store') setStoreAnimation('jump');
      else setLocalAnimation('jump');
      setTimeout(() => {
        if (controlType === 'store') setStoreAnimation('idle');
        else setLocalAnimation('idle');
      }, 2500);
    } else {
      // Error: reset
      if (controlType === 'store') setStoreAnimation('talk');
      else setLocalAnimation('talk');
      setTimeout(() => {
        if (controlType === 'store') setStoreAnimation('idle');
        else setLocalAnimation('idle');
      }, 3000);
    }
  };

  const currentDisplayAnimation = controlType === 'prop' ? (localAnimation || 'idle') : storeAnimation;

  const colorPresets = [
    { name: 'Vibrant Blue', hex: '#3b82f6' },
    { name: 'Cyberpunk Purple', hex: '#8b5cf6' },
    { name: 'Hot Pink', hex: '#ec4899' },
    { name: 'Matrix Green', hex: '#10b981' },
    { name: 'Safety Orange', hex: '#f97316' },
    { name: 'Carbon Black', hex: '#374151' },
  ];

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 md:p-8 font-sans">
      {/* Header */}
      <header className="mb-8 border-b border-slate-900 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">
              WebGL v3D
            </span>
            <span className="text-slate-500 font-mono text-xs">· Next.js 16 App Router</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
            3D Voxel Rig Explorer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Interactive R3F procedural character controller featuring prop-driven customization and global Zustand store state.
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href="/"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-sm font-medium transition-colors"
          >
            ← Back to App
          </a>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto w-full flex-grow">
        
        {/* Left Side: 3D Scene Viewport (Columns 1-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4 w-full">
          <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
            {/* Canvas Container */}
            <div className="w-full aspect-[4/3] md:aspect-[16/10] min-h-[400px]">
              <CharacterScene
                animation={localAnimation}
                color={characterColor}
                scale={characterScale}
                showGrid={showGrid}
                autoRotate={autoRotate}
              />
            </div>
            
            {/* Corner Quick Toggles */}
            <div className="absolute top-4 left-4 flex gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${
                  showGrid
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                GRID: {showGrid ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${
                  autoRotate
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                ORBIT SPIN: {autoRotate ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="absolute top-4 right-4">
              <span className="px-3 py-1.5 bg-slate-900/90 backdrop-blur rounded-md border border-slate-800 text-xs font-mono text-indigo-400 font-semibold shadow">
                FPS: 60 (PROCEDURAL)
              </span>
            </div>
          </div>

          {/* Interactive Chatbot Panel */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide text-slate-300 uppercase font-mono flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                AI Agent Chatbot Integration
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">TRIGGERS TALK ANIMATION</span>
            </div>
            
            {/* Chat Output history */}
            <div className="h-44 overflow-y-auto bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-3 scrollbar-thin">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3.5 py-2 rounded-xl text-xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-850 border border-slate-800 px-3.5 py-2 rounded-xl text-xs rounded-bl-none text-slate-400">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat input form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type 'hello', 'walk', 'jump', or chat..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={isTyping}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Controllers (Columns 8-12) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          
          {/* Main Rig Controller */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Outfit & Scale Customizer</h2>
              <p className="text-xs text-slate-400 mt-0.5">Procedural material settings & transformations</p>
            </div>

            {/* Scale Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Scale:</span>
                <span className="text-indigo-400 font-bold">{characterScale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={characterScale}
                onChange={(e) => setCharacterScale(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Color Customizer */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-slate-400">Armor Base Color:</label>
              <div className="grid grid-cols-6 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => setCharacterColor(preset.hex)}
                    style={{ backgroundColor: preset.hex }}
                    className={`h-8 rounded-lg border-2 transition-all ${
                      characterColor === preset.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={characterColor}
                  onChange={(e) => setCharacterColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-400">Hex:</span>
                <input
                  type="text"
                  value={characterColor}
                  onChange={(e) => setCharacterColor(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-indigo-300 w-24"
                />
              </div>
            </div>
          </div>

          {/* Animation Drivers */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-200">Animation Controller</h2>
                <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                  <button
                    onClick={() => setControlType('prop')}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded-md font-semibold transition-all ${
                      controlType === 'prop' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    PROP
                  </button>
                  <button
                    onClick={() => setControlType('store')}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded-md font-semibold transition-all ${
                      controlType === 'store' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    STORE
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {controlType === 'prop' 
                  ? "Driving via direct React prop: <CharacterScene animation='...' />" 
                  : "Driving via global Zustand store dispatch: useCharacterStore.setState({ animation: '...' })"
                }
              </p>
            </div>

            {/* Animation Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
              {(['idle', 'walk', 'wave', 'jump', 'talk'] as CharacterAnimation[]).map((anim) => {
                const isActive = anim === currentDisplayAnimation;
                return (
                  <button
                    key={anim}
                    onClick={() => {
                      if (controlType === 'store') {
                        setStoreAnimation(anim);
                      } else {
                        setLocalAnimation(anim);
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-semibold transition-all uppercase ${
                      isActive
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {anim}
                  </button>
                );
              })}
            </div>
            
            {/* Alert info box */}
            <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex gap-3 text-xs text-indigo-300 leading-normal">
              <span className="text-base select-none">💡</span>
              <p>
                {controlType === 'prop' 
                  ? "Prop-driven animation allows isolated page control. Ideal for quick embedding." 
                  : "Store-driven animation is global. Any decoupled page widget (like the chat input below or a workflow trigger) can reactively animate the character without passing prop callbacks."
                }
              </p>
            </div>
          </div>

          {/* Workflow Event Triggers */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wider uppercase">
                Workflow Actions simulation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Trigger animation sequences from system events</p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => triggerWorkflowEvent('deploy')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 font-semibold px-4 py-2.5 rounded-xl text-xs tracking-wider font-mono transition-colors"
              >
                ⚡ TRIGGER "DEPLOY CODE" SEQUENCE
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => triggerWorkflowEvent('success')}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide font-mono text-emerald-400 transition-colors"
                >
                  🎉 EVENT: SUCCESS
                </button>
                <button
                  onClick={() => triggerWorkflowEvent('error')}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide font-mono text-rose-400 transition-colors"
                >
                  ⚠️ EVENT: TALKBACK
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Code Usage segment */}
      <footer className="mt-12 max-w-7xl mx-auto w-full border-t border-slate-900 pt-8 mb-8">
        <h3 className="text-lg font-bold text-slate-200 mb-4 font-mono">Code Integration & Usage</h3>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Example Usage (Next.js 16 / Page component)</span>
            <span className="text-[10px] text-emerald-500 font-semibold">TYPESCRIPT VALIDATED</span>
          </div>
          <pre className="p-5 overflow-x-auto text-xs font-mono text-indigo-300/90 leading-relaxed scrollbar-thin">
{`import CharacterScene from '@/components/CharacterScene';
import { useCharacterStore } from '@/store/useCharacterStore';

export default function DashboardPage() {
  // Option A: Prop-driven (isolated control)
  return (
    <div className="w-[500px] h-[500px]">
      <CharacterScene animation="talk" color="#ec4899" scale={1.5} showGrid={true} />
    </div>
  );
}

// Option B: Store-driven (trigger from separated elements)
function DeployButton() {
  const setAnimation = useCharacterStore(state => state.setAnimation);

  const handleDeploy = () => {
    // 1. Trigger walking animation during build simulation
    setAnimation('walk');
    
    // 2. Perform build operations...
    setTimeout(() => {
      // 3. Celebratory jump on completion!
      setAnimation('jump');
    }, 2000);
  };

  return <button onClick={handleDeploy}>Deploy App</button>;
}`}
          </pre>
        </div>
      </footer>
    </div>
  );
}
