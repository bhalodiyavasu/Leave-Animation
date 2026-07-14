import { create } from 'zustand';

export type CharacterAnimation = 'idle' | 'walk' | 'wave' | 'jump' | 'talk' | 'sleep' | 'read' | 'thinking' | 'yawn' | 'lean';
export type DeliveryState = 'sleeping' | 'reading' | 'delivering' | 'returning' | 'waiting';

interface CharacterState {
  animation: CharacterAnimation;
  setAnimation: (animation: CharacterAnimation) => void;
  deliveryState: DeliveryState;
  setDeliveryState: (state: DeliveryState) => void;
  isPlayfulMode: boolean;
  setIsPlayfulMode: (mode: boolean) => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  animation: 'sleep', // Start asleep in lobby/dashboard
  setAnimation: (animation) => set({ animation }),
  deliveryState: 'sleeping',
  setDeliveryState: (deliveryState) => set({ deliveryState }),
  isPlayfulMode: false, // Professional UI is default
  setIsPlayfulMode: (isPlayfulMode) => set({ isPlayfulMode }),
}));
