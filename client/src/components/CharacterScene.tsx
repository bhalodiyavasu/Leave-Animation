"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import VoxelCharacter, { VoxelCharacterProps } from "./VoxelCharacter";

interface CharacterSceneProps extends VoxelCharacterProps {
  showGrid?: boolean;
  orbitControls?: boolean;
  autoRotate?: boolean;
}

export default function CharacterScene({
  animation,
  color,
  scale = 1.3,
  showGrid = true,
  orbitControls = true,
  autoRotate = false,
}: CharacterSceneProps) {
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch in Next.js Server Components
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-950 rounded-2xl border border-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-400 font-mono">
            Initializing 3D Environment...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-indigo-950/20">
      <Canvas
        shadows
        camera={{ position: [0, 2.5, 4.5], fov: 40 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        {/* Sky/Atmosphere Tint */}
        <color attach="background" args={["#030712"]} />

        {/* Soft atmospheric mist */}
        <fog attach="fog" args={["#030712", 5, 12]} />

        {/* Ambient illumination */}
        <ambientLight intensity={0.5} />

        {/* Primary Sun Light (shadow caster) */}
        <directionalLight
          castShadow
          position={[4, 8, 4]}
          intensity={1.2}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={15}
          shadow-camera-left={-2}
          shadow-camera-right={2}
          shadow-camera-top={2}
          shadow-camera-bottom={-2}
          shadow-bias={-0.0005}
        />

        {/* Secondary Fill Light (blue tint from bottom-back) */}
        <directionalLight
          position={[-4, 2, -4]}
          intensity={0.4}
          color="#818cf8"
        />

        {/* Glowing Rim Light behind character */}
        <pointLight
          position={[0, 2, -2]}
          intensity={0.8}
          color="#00f3ff"
          distance={6}
        />

        {/* The Animated Voxel Character */}
        <group position={[0, -0.4, 0]}>
          <VoxelCharacter animation={animation} color={color} scale={scale} />

          {/* Circular shadow receiver floor */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.001, 0]}
            receiveShadow
          >
            <planeGeometry args={[15, 15]} />
            <shadowMaterial opacity={0.3} />
          </mesh>

          {/* Premium holographic digital grid floor */}
          {showGrid && (
            <gridHelper
              args={[12, 12, "#4f46e5", "#1e1b4b"]}
              position={[0, 0, 0]}
            />
          )}
        </group>

        {/* Interactive Camera controls */}
        {orbitControls && (
          <OrbitControls
            enablePan={false}
            minDistance={2.5}
            maxDistance={8}
            maxPolarAngle={Math.PI / 2 + 0.05} // Limit looking below ground
            minPolarAngle={0.1}
            autoRotate={autoRotate}
            autoRotateSpeed={1.5}
          />
        )}
      </Canvas>

      {/* Sleek bottom overlay indicator */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center px-4 py-2 bg-slate-900/85 backdrop-blur-md rounded-lg border border-slate-800 text-xs font-mono text-slate-400 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>VOX-R3D RIG ACTIVE</span>
        </div>
        <div>
          <span>MODE: {animation ? animation.toUpperCase() : "STORE"}</span>
        </div>
      </div>
    </div>
  );
}
