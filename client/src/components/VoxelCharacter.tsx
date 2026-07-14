"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCharacterStore } from "@/store/useCharacterStore";

export interface VoxelCharacterProps {
  animation?:
    | "idle"
    | "walk"
    | "wave"
    | "jump"
    | "talk"
    | "sleep"
    | "read"
    | "yawn"
    | "lean"
    | "thinking";
  color?: string; // Brand base color (default: Neon Foam/Teal)
  scale?: number;
  carryingMessage?: boolean;
}

export default function VoxelCharacter({
  animation: propAnimation,
  color = "#00f5d4", // Coral/HR Brand Foam Teal
  scale = 1,
  carryingMessage = false,
}: VoxelCharacterProps) {
  const storeAnimation = useCharacterStore((state) => state.animation);
  const activeAnimation = propAnimation || storeAnimation;

  // Rigging Joints
  const masterRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  // Palette Configuration (Modern Robotic AI Mascot)
  const bodyColor = "#f8fafc"; // Sleek matte white plastic main body
  const accentColor = color; // Neon Brand Teal
  const darkPartsColor = "#1e293b"; // Charcoal headphones/pants
  const eyeColor = "#0f172a"; // Jet black glossy eyes
  const glowColor = "#00f3ff"; // Emissive cyber blue/cyan

  // References for dynamic eye scaling
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const safeDelta = Math.min(delta, 0.1);
    const lerpSpeed = 12;

    // 1. Random blink logic (every 4-5 seconds, shut eyes briefly)
    const blinkCycle = t % 4.5;
    const isBlinking = blinkCycle < 0.18;

    // Calculate eye scale Y based on current state & blink
    let eyeScaleY = 1.0;
    if (activeAnimation === "sleep") {
      eyeScaleY = 0.05; // shut eyes
    } else if (activeAnimation === "yawn") {
      eyeScaleY = 0.3; // sleepy droop
    } else if (activeAnimation === "thinking") {
      eyeScaleY = 0.75; // focused squint
    } else if (isBlinking) {
      eyeScaleY = 0.05; // rapid blink
    }

    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(
        leftEyeRef.current.scale.y,
        eyeScaleY,
        safeDelta * 24,
      );
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(
        rightEyeRef.current.scale.y,
        eyeScaleY,
        safeDelta * 24,
      );
    }

    // 2. Bone rigging math
    let masterY = 0;

    // Idle bobbing
    let headX = Math.sin(t * 1.5) * 0.03;
    let headY = 0;
    let headZ = 0;

    let torsoY = Math.sin(t * 2) * 0.015;
    let torsoX = 0;
    let torsoZ = 0;

    let rightArmX = Math.sin(t * 2) * 0.04;
    let rightArmY = 0;
    let rightArmZ = -0.08;

    let leftArmX = -Math.sin(t * 2) * 0.04;
    let leftArmY = 0;
    let leftArmZ = 0.08;

    let rightLegX = 0;
    let rightLegZ = 0;
    let leftLegX = 0;
    let leftLegZ = 0;

    switch (activeAnimation) {
      case "sleep": {
        headX = 0.4;
        headY = 0;
        headZ = 0.05;
        torsoY = Math.sin(t * 1.2) * 0.01 - 0.02;
        rightArmX = 0.15;
        rightArmZ = -0.05;
        leftArmX = 0.15;
        leftArmZ = 0.05;
        break;
      }

      case "read": {
        headX = 0.35;
        headY = Math.sin(t * 6.5) * 0.12;
        headZ = 0;
        torsoY = Math.sin(t * 2) * 0.01;
        rightArmX = 0.65;
        rightArmZ = -0.2;
        leftArmX = 0.65;
        leftArmZ = 0.2;
        break;
      }

      case "thinking": {
        headX = 0.32;
        headY = -0.15;
        headZ = -0.05;
        torsoY = Math.sin(t * 2) * 0.01;
        leftArmX = 0.75;
        leftArmZ = -0.18;
        rightArmX = 0.55 + Math.sin(t * 18) * 0.12;
        rightArmZ = -0.1;
        break;
      }

      case "yawn": {
        headX = -0.3;
        headY = 0;
        torsoY = Math.sin(t * 1.5) * 0.008;
        torsoX = -0.04;
        rightArmX = -1.4;
        rightArmZ = -0.3;
        leftArmX = -1.4;
        leftArmZ = 0.3;
        break;
      }

      case "lean": {
        torsoZ = 0.08;
        headZ = -0.04;
        rightArmX = 0.55;
        rightArmZ = 0.3;
        leftArmX = 0.55;
        leftArmZ = -0.3;
        break;
      }

      case "walk": {
        const walkSpeed = 2.5; // slowed down from 8.5
        const swing = 0.38; // smaller steps for a cute chibi walk
        rightLegX = Math.sin(t * walkSpeed) * swing;
        leftLegX = -Math.sin(t * walkSpeed) * swing;
        rightArmX = -Math.sin(t * walkSpeed) * (swing * 0.75);
        leftArmX = Math.sin(t * walkSpeed) * (swing * 0.75);
        rightArmZ = -0.12;
        leftArmZ = 0.12;
        torsoY = Math.abs(Math.sin(t * walkSpeed * 2)) * 0.03 - 0.015; // gentler torso bobbing
        torsoZ = Math.sin(t * walkSpeed) * 0.015;
        headX = Math.sin(t * walkSpeed) * 0.02 + 0.01;
        break;
      }

      case "wave": {
        rightArmZ = -2.0 + Math.sin(t * 12) * 0.35;
        rightArmX = -0.1;
        rightArmY = 0;
        leftArmX = Math.sin(t * 1.5) * 0.04;
        leftArmZ = 0.06;
        headZ = -0.06;
        headY = -0.06;
        break;
      }

      case "jump": {
        const jumpCycle = t * 4.5;
        const sine = Math.sin(jumpCycle);
        if (sine > 0) {
          masterY = sine * 0.8;
          rightArmZ = -1.0;
          leftArmZ = 1.0;
          rightArmX = -0.15;
          leftArmX = -0.15;
          rightLegX = 0.12;
          leftLegX = -0.12;
        } else {
          masterY = 0;
          torsoY = sine * 0.08;
          rightLegX = -sine * 0.15;
          leftLegX = -sine * 0.15;
          rightArmZ = sine * 0.1 - 0.06;
          leftArmZ = -sine * 0.1 + 0.06;
        }
        break;
      }

      case "talk": {
        headY = Math.sin(t * 5) * 0.18;
        headX = 0.05 + Math.sin(t * 8) * 0.04;
        rightArmX = 0.3 + Math.sin(t * 4.5) * 0.1;
        rightArmZ = -0.18;
        leftArmX = 0.2 - Math.cos(t * 4) * 0.1;
        leftArmZ = 0.18;
        torsoY = Math.sin(t * 2) * 0.015;
        break;
      }
    }

    // Head tracking override: only active in idle, talk, or wave animations
    const canTrackHead =
      activeAnimation === "idle" ||
      activeAnimation === "talk" ||
      activeAnimation === "wave";
    if (canTrackHead) {
      headY = state.pointer.x * 0.45; // Turn head left/right to follow cursor
      headX =
        -state.pointer.y * 0.3 +
        (activeAnimation === "talk"
          ? Math.sin(t * 8) * 0.04
          : Math.sin(t * 1.5) * 0.03); // Tilt up/down
    }

    // Apply linear interpolation
    const step = safeDelta * lerpSpeed;

    if (masterRef.current) {
      masterRef.current.position.y = THREE.MathUtils.lerp(
        masterRef.current.position.y,
        masterY,
        step,
      );
    }
    if (torsoRef.current) {
      torsoRef.current.position.y = THREE.MathUtils.lerp(
        torsoRef.current.position.y,
        torsoY + 0.65,
        step,
      );
      torsoRef.current.rotation.x = THREE.MathUtils.lerp(
        torsoRef.current.rotation.x,
        torsoX,
        step,
      );
      torsoRef.current.rotation.z = THREE.MathUtils.lerp(
        torsoRef.current.rotation.z,
        torsoZ,
        step,
      );
    }
    if (headRef.current) {
      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        headX,
        step,
      );
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        headY,
        step,
      );
      headRef.current.rotation.z = THREE.MathUtils.lerp(
        headRef.current.rotation.z,
        headZ,
        step,
      );
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.x,
        rightArmX,
        step,
      );
      rightArmRef.current.rotation.y = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.y,
        rightArmY,
        step,
      );
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.z,
        rightArmZ,
        step,
      );
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.x,
        leftArmX,
        step,
      );
      leftArmRef.current.rotation.y = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.y,
        leftArmY,
        step,
      );
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.z,
        leftArmZ,
        step,
      );
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(
        rightLegRef.current.rotation.x,
        rightLegX,
        step,
      );
      rightLegRef.current.rotation.z = THREE.MathUtils.lerp(
        rightLegRef.current.rotation.z,
        rightLegZ,
        step,
      );
    }
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(
        leftLegRef.current.rotation.x,
        leftLegX,
        step,
      );
      leftLegRef.current.rotation.z = THREE.MathUtils.lerp(
        leftLegRef.current.rotation.z,
        leftLegZ,
        step,
      );
    }
  });

  return (
    <group ref={masterRef} scale={[scale, scale, scale]}>
      {/* 1. TORSO (Chibi: Short blocky chest matching brand color) */}
      <group ref={torsoRef}>
        {/* Main Chest block */}
        <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[0.55, 0.7, 0.38]} />
          <meshStandardMaterial
            color={accentColor}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>

        {/* Glow Accent: Neck Ring */}
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[0.22, 0.05, 0.22]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={1.8}
          />
        </mesh>

        {/* Signature Accessory: AI Badge on Chest */}
        <mesh position={[0, 0.48, 0.2]}>
          <boxGeometry args={[0.12, 0.12, 0.02]} />
          <meshStandardMaterial color={darkPartsColor} roughness={0.4} />
        </mesh>
        {/* Glowing logo dot inside badge */}
        <mesh position={[0, 0.48, 0.215]}>
          <boxGeometry args={[0.04, 0.04, 0.015]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={2.5}
          />
        </mesh>

        {/* 2. HEAD (Chibi: Oversized cube ~42% of total height) */}
        <group ref={headRef} position={[0, 0.74, 0]}>
          {/* Main Face/Brain box */}
          <mesh castShadow receiveShadow position={[0, 0.46, 0]}>
            <boxGeometry args={[0.92, 0.88, 0.92]} />
            <meshStandardMaterial
              color={bodyColor}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>

          {/* Hair Cap/Visor overlay (sleek gray panel) */}
          <mesh castShadow position={[0, 0.82, 0.05]}>
            <boxGeometry args={[0.96, 0.18, 0.88]} />
            <meshStandardMaterial color={darkPartsColor} roughness={0.7} />
          </mesh>

          {/* 3D Headset Accessory (Representing AI copilot) */}
          {/* Headband connecting top */}
          <mesh position={[0, 0.91, 0]}>
            <boxGeometry args={[0.94, 0.06, 0.16]} />
            <meshStandardMaterial color={darkPartsColor} roughness={0.6} />
          </mesh>
          {/* Left Earcup */}
          <mesh position={[-0.48, 0.46, 0]}>
            <boxGeometry args={[0.06, 0.28, 0.28]} />
            <meshStandardMaterial color={darkPartsColor} roughness={0.6} />
          </mesh>
          {/* Left Earcup Glow Ring */}
          <mesh position={[-0.515, 0.46, 0]}>
            <boxGeometry args={[0.015, 0.16, 0.16]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={2.5}
            />
          </mesh>
          {/* Right Earcup */}
          <mesh position={[0.48, 0.46, 0]}>
            <boxGeometry args={[0.06, 0.28, 0.28]} />
            <meshStandardMaterial color={darkPartsColor} roughness={0.6} />
          </mesh>
          {/* Right Earcup Glow Ring */}
          <mesh position={[0.515, 0.46, 0]}>
            <boxGeometry args={[0.015, 0.16, 0.16]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={2.5}
            />
          </mesh>
          {/* Mic Boom Arm */}
          <mesh position={[-0.44, 0.32, 0.22]} rotation={[0.2, 0.4, 0]}>
            <boxGeometry args={[0.03, 0.03, 0.18]} />
            <meshStandardMaterial color={darkPartsColor} />
          </mesh>
          {/* Glowing mic tip */}
          <mesh position={[-0.36, 0.28, 0.32]}>
            <boxGeometry args={[0.04, 0.04, 0.04]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={2.0}
            />
          </mesh>

          {/* Rounded Eyes (Group for scaling and blinking) */}
          {/* Left Eye */}
          <group ref={leftEyeRef} position={[-0.24, 0.46, 0.47]}>
            <mesh>
              <boxGeometry args={[0.12, 0.2, 0.02]} />
              <meshStandardMaterial color={eyeColor} roughness={0.2} />
            </mesh>
            {/* Soft pupil spark */}
            <mesh position={[0.03, 0.05, 0.012]}>
              <boxGeometry args={[0.04, 0.06, 0.005]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
          </group>

          {/* Right Eye */}
          <group ref={rightEyeRef} position={[0.24, 0.46, 0.47]}>
            <mesh>
              <boxGeometry args={[0.12, 0.2, 0.02]} />
              <meshStandardMaterial color={eyeColor} roughness={0.2} />
            </mesh>
            {/* Soft pupil spark */}
            <mesh position={[-0.03, 0.05, 0.012]}>
              <boxGeometry args={[0.04, 0.06, 0.005]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
          </group>

          {/* 3D Envelope/Message Box (Delivering accessory) */}
          {carryingMessage && (
            <group position={[0, 0.98, 0]}>
              <mesh castShadow position={[0, 0, 0]}>
                <boxGeometry args={[0.38, 0.24, 0.08]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0.042]}>
                <boxGeometry args={[0.06, 0.06, 0.01]} />
                <meshStandardMaterial color="#ff0055" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.05, 0.041]}>
                <boxGeometry args={[0.24, 0.015, 0.01]} />
                <meshStandardMaterial color="#e2e8f0" />
              </mesh>
            </group>
          )}
        </group>

        {/* 3. LEFT ARM (Thinner width 0.12 for friendly look) */}
        <group ref={leftArmRef} position={[-0.36, 0.6, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.12, 0.45, 0.12]} />
            <meshStandardMaterial color={bodyColor} roughness={0.5} />
          </mesh>
          {/* Glowing wrist band */}
          <mesh position={[0, -0.38, 0]}>
            <boxGeometry args={[0.14, 0.03, 0.14]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={1.8}
            />
          </mesh>

          {/* 📋 Thinking Clipboard (Wood board, white paper & metal clip) */}
          {activeAnimation === "thinking" && (
            <group position={[0.08, -0.42, 0.15]} rotation={[0.4, -0.15, -0.1]}>
              <mesh castShadow>
                <boxGeometry args={[0.26, 0.36, 0.03]} />
                <meshStandardMaterial color="#78350f" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.01, 0.018]}>
                <boxGeometry args={[0.2, 0.3, 0.005]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.15, 0.022]}>
                <boxGeometry args={[0.1, 0.04, 0.02]} />
                <meshStandardMaterial
                  color="#64748b"
                  metalness={0.7}
                  roughness={0.2}
                />
              </mesh>
            </group>
          )}
        </group>

        {/* 4. RIGHT ARM (Thinner width 0.12) */}
        <group ref={rightArmRef} position={[0.36, 0.6, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.12, 0.45, 0.12]} />
            <meshStandardMaterial color={bodyColor} roughness={0.5} />
          </mesh>
          {/* Glowing wrist band */}
          <mesh position={[0, -0.38, 0]}>
            <boxGeometry args={[0.14, 0.03, 0.14]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={1.8}
            />
          </mesh>
        </group>
      </group>

      {/* 5. LEFT LEG (Thicker width 0.18 for stable chibi balance) */}
      <group ref={leftLegRef} position={[-0.16, 0.62, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.18, 0.6, 0.18]} />
          <meshStandardMaterial color={darkPartsColor} roughness={0.5} />
        </mesh>
        {/* Glowing Ankle Band */}
        <mesh position={[0, -0.46, 0]}>
          <boxGeometry args={[0.2, 0.03, 0.2]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={1.8}
          />
        </mesh>
        {/* Small Foot */}
        <mesh castShadow position={[0, -0.58, 0.02]}>
          <boxGeometry args={[0.2, 0.08, 0.24]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>
      </group>

      {/* 6. RIGHT LEG (Thicker width 0.18) */}
      <group ref={rightLegRef} position={[0.16, 0.62, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.18, 0.6, 0.18]} />
          <meshStandardMaterial color={darkPartsColor} roughness={0.5} />
        </mesh>
        {/* Glowing Ankle Band */}
        <mesh position={[0, -0.46, 0]}>
          <boxGeometry args={[0.2, 0.03, 0.2]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={1.8}
          />
        </mesh>
        {/* Small Foot */}
        <mesh castShadow position={[0, -0.58, 0.02]}>
          <boxGeometry args={[0.2, 0.08, 0.24]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
