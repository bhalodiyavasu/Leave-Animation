"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import VoxelCharacter from './VoxelCharacter';
import { useCharacterStore } from '@/store/useCharacterStore';

type IdleState = 'idle' | 'sleeping' | 'yawning' | 'leaning' | 'pacing_left' | 'pacing_wait' | 'pacing_right';

interface CharacterControllerProps {
  onDeliverComplete: () => void;
  aiInput: string;
  onThoughtChange: (thought: string | null) => void;
  isThinking: boolean;
  idleState: IdleState;
  setIdleState: React.Dispatch<React.SetStateAction<IdleState>>;
}

function CharacterController({ 
  onDeliverComplete, 
  aiInput, 
  onThoughtChange, 
  isThinking,
  idleState,
  setIdleState
}: CharacterControllerProps) {
  const deliveryState = useCharacterStore((state) => state.deliveryState);
  const setDeliveryState = useCharacterStore((state) => state.setDeliveryState);
  const setAnimation = useCharacterStore((state) => state.setAnimation);
  const animation = useCharacterStore((state) => state.animation);
  
  const characterRef = useRef<THREE.Group>(null);
  
  const targetRotYRef = useRef(-0.5); // face slightly forward-left
  const carryingMessageRef = useRef(false);

  // Monitor activity & reset idle state
  useEffect(() => {
    setIdleState('idle');
    onThoughtChange(null);
  }, [aiInput, deliveryState, onThoughtChange, isThinking, setIdleState]);

  // Inactivity cycles with randomized action picker
  useEffect(() => {
    if (deliveryState !== 'waiting' && deliveryState !== 'sleeping') {
      return;
    }

    let activeTimeout: any;
    let resetTimeout: any;

    const scheduleNextAction = () => {
      // Wait for a random interval between 15 and 25 seconds of silence
      const randomInterval = 15000 + Math.random() * 10000;

      activeTimeout = setTimeout(() => {
        if (isThinking || (deliveryState !== 'waiting' && deliveryState !== 'sleeping')) {
          scheduleNextAction();
          return;
        }

        // Pool of random actions
        const actions: ('yawning' | 'pacing_left' | 'leaning' | 'sleeping' | 'idle')[] = [
          'yawning',
          'pacing_left',
          'leaning',
          'sleeping',
          'idle'
        ];

        // Pick one at random
        const chosenAction = actions[Math.floor(Math.random() * actions.length)];

        // Define thought pools for variety (silent for random idle actions)
        const thoughtsMap = {
          yawning: [null],
          pacing_left: [null],
          leaning: [null],
          sleeping: [null],
          idle: [null]
        };

        const thoughts = thoughtsMap[chosenAction];
        const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];

        setIdleState(chosenAction);
        onThoughtChange(randomThought);

        // Schedule resetting to idle if it's a temporary action (yawning, pacing, leaning)
        let resetDuration = 5000; // standard action length
        if (chosenAction === 'yawning') {
          resetDuration = 3000;
        } else if (chosenAction === 'pacing_left') {
          resetDuration = 5700; // walk left (1.6s) + wait (2.5s) + walk right (1.6s) = 5.7s total
        }

        if (chosenAction !== 'sleeping' && chosenAction !== 'idle') {
          resetTimeout = setTimeout(() => {
            setIdleState('idle');
            onThoughtChange(null);
          }, resetDuration);
        }

        // Schedule next action loop
        scheduleNextAction();
      }, randomInterval);
    };

    scheduleNextAction();

    return () => {
      clearTimeout(activeTimeout);
      clearTimeout(resetTimeout);
    };
  }, [deliveryState, onThoughtChange, isThinking, setIdleState]);

  // Map active state to animations and rotations
  useEffect(() => {
    if (deliveryState === 'delivering') {
      targetRotYRef.current = -Math.PI / 2; // face left
      carryingMessageRef.current = true;
      setAnimation('walk');
      return;
    }

    if (deliveryState === 'returning') {
      targetRotYRef.current = Math.PI / 2; // face right
      carryingMessageRef.current = false;
      setAnimation('walk');
      return;
    }

    if (isThinking) {
      targetRotYRef.current = -0.5;
      carryingMessageRef.current = false;
      setAnimation('thinking');
      return;
    }

    if (deliveryState === 'reading') {
      targetRotYRef.current = -0.5;
      carryingMessageRef.current = false;
      setAnimation('read');
      return;
    }

    // Waiting/Sleeping sub-idle actions mapping
    switch (idleState) {
      case 'idle':
        targetRotYRef.current = -0.5;
        carryingMessageRef.current = false;
        setAnimation('idle');
        break;
      case 'sleeping':
        targetRotYRef.current = -0.5;
        carryingMessageRef.current = false;
        setAnimation('sleep');
        break;
      case 'yawning':
        targetRotYRef.current = -0.5;
        carryingMessageRef.current = false;
        setAnimation('yawn');
        break;
      case 'leaning':
        targetRotYRef.current = -0.5;
        carryingMessageRef.current = false;
        setAnimation('lean');
        break;
      case 'pacing_left':
        targetRotYRef.current = -Math.PI / 2; // face left
        carryingMessageRef.current = false;
        setAnimation('walk');
        break;
      case 'pacing_wait':
        targetRotYRef.current = -0.5; // face screen
        carryingMessageRef.current = false;
        setAnimation('idle');
        break;
      case 'pacing_right':
        targetRotYRef.current = Math.PI / 2; // face right back to edge
        carryingMessageRef.current = false;
        setAnimation('walk');
        break;
    }
  }, [deliveryState, idleState, setAnimation, isThinking]);

  return (
    <group ref={characterRef} position={[0, -1.2, 0]} rotation={[0, targetRotYRef.current, 0]}>
      <VoxelCharacter 
        animation={animation} 
        carryingMessage={carryingMessageRef.current}
        scale={0.32}
      />
    </group>
  );
}

export default function ChatBotCharacter({ 
  onDeliverComplete,
  aiInput,
  isThinking
}: { 
  onDeliverComplete: () => void;
  aiInput: string;
  isThinking: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const isPlayfulMode = useCharacterStore((state) => state.isPlayfulMode);
  const deliveryState = useCharacterStore((state) => state.deliveryState);
  const setDeliveryState = useCharacterStore((state) => state.setDeliveryState);
  const setAnimation = useCharacterStore((state) => state.setAnimation);

  // Lifted States
  const [idleState, setIdleState] = useState<IdleState>('idle');
  const [thought, setThought] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Time-of-day welcoming greeting on first load
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) {
      // Late night: 10 PM - 5 AM
      setThought("Working late? 🌙 Don't forget to get some rest!");
    } else if (hour >= 5 && hour < 11) {
      // Morning: 5 AM - 11 AM (performs stretch/yawn)
      setThought("Good morning! Ready for today's leaves? ☕");
      setIdleState('yawning');
      const timer = setTimeout(() => {
        setIdleState('idle');
        setThought(null);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // General day time
      setThought("Hello Admin! Ready to manage some leaves? 💼");
      const timer = setTimeout(() => {
        setThought(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [setIdleState]);

  // Handle Delivery Sequence Transitions
  useEffect(() => {
    if (deliveryState === 'delivering') {
      setAnimation('walk');
      const timer = setTimeout(() => {
        setAnimation('talk');
        const nextTimer = setTimeout(() => {
          onDeliverComplete();
          setDeliveryState('returning');
        }, 600);
        return () => clearTimeout(nextTimer);
      }, 3200); // slowed down to 3.2s
      return () => clearTimeout(timer);
    } else if (deliveryState === 'returning') {
      setAnimation('walk');
      const timer = setTimeout(() => {
        setDeliveryState('waiting');
      }, 3200); // slowed down to 3.2s
      return () => clearTimeout(timer);
    }
  }, [deliveryState, setDeliveryState, setAnimation, onDeliverComplete]);

  // Handle Pacing Sub-State Transitions (so translation matches pacing walk frames)
  useEffect(() => {
    if (idleState === 'pacing_left') {
      const timer = setTimeout(() => {
        setIdleState('pacing_wait');
      }, 1600); // 1.6s walk to center
      return () => clearTimeout(timer);
    } else if (idleState === 'pacing_wait') {
      const timer = setTimeout(() => {
        setIdleState('pacing_right');
      }, 2500); // wait at center
      return () => clearTimeout(timer);
    } else if (idleState === 'pacing_right') {
      const timer = setTimeout(() => {
        setIdleState('idle');
      }, 1600); // 1.6s walk back
      return () => clearTimeout(timer);
    }
  }, [idleState]);

  if (!mounted || !isPlayfulMode) return null;

  // Calculate CSS positioning values dynamically
  const parentWidth = containerRef.current?.parentElement?.clientWidth || 600;
  
  let translateX = 0;

  // Override container translation coordinates during pacing or delivering
  if (deliveryState === 'delivering') {
    translateX = -(parentWidth - 140);
  } else if (deliveryState === 'returning') {
    translateX = 0;
  } else if (idleState === 'pacing_left' || idleState === 'pacing_wait') {
    translateX = -Math.max((parentWidth - 140) / 2, 80); // walk exactly to center
  }

  let transitionDuration = '3.2s';
  if (deliveryState === 'waiting' && (idleState === 'pacing_left' || idleState === 'pacing_right')) {
    transitionDuration = '1.6s';
  }

  return (
    <div 
      ref={containerRef}
      style={{
        transform: `translateX(${translateX}px)`,
        transition: `transform ${transitionDuration} cubic-bezier(0.25, 1, 0.5, 1)`,
      }}
      className="absolute right-4 bottom-[80px] w-[140px] h-[180px] z-30 select-none"
    >
      {/* 3D Canvas inside the container */}
      <div className="w-full h-full pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 3.8], fov: 45 }}
          shadows
          gl={{ alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={1.2} />
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={1.2} 
            castShadow 
            shadow-mapSize={[256, 256]}
          />
          <pointLight position={[-3, 2, 2]} intensity={0.4} color="#00f3ff" />
          
          <CharacterController 
            onDeliverComplete={onDeliverComplete} 
            aiInput={aiInput}
            onThoughtChange={setThought}
            isThinking={isThinking}
            idleState={idleState}
            setIdleState={setIdleState}
          />
        </Canvas>
      </div>

      {/* Floating Thought Bubble */}
      {thought && (
        <div className="absolute left-[-160px] top-[10px] w-[160px] bg-abyss border border-glass-border/40 text-sky-100 rounded-2xl rounded-br-sm p-3 text-[11px] shadow-2xl animate-bounce pointer-events-auto leading-relaxed z-40">
          <div className="font-extrabold text-foam text-[10px] uppercase tracking-wider mb-1">
            Assistant
          </div>
          <div>{thought}</div>
          {/* Speech bubble tail */}
          <div className="absolute bottom-[14px] right-[-6px] w-2.5 h-2.5 bg-abyss border-t border-r border-glass-border/40 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}
