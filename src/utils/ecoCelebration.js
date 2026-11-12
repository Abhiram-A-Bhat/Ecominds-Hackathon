// Global Guardian Campus Celebration & Mascot Trigger Dispatcher
// Emits randomized celebration events across the platform when eco-actions are completed

import { triggerConfetti } from './confetti';

export const CELEBRATION_VARIANTS = [
  'THUMBS_UP',      // Cute Sprout giving a cheerful green thumbs up
  'COOL_SUNGLASSES', // Sprout sliding on pixel sunglasses "Deal With It"
  'SUPER_STAR',     // Superhero Sprout with cape, crown, and gold eco-sparks
  'FLOWER_BLOOM',   // Rapid flowering blossom with floating flower petals
  'ZEN_MASTER'      // Floating meditating lotus sprout with aura rings
];

export function triggerEcoCelebration({
  title = "Campus Eco-Action Verified!",
  message = "Positive sustainability impact logged to NAAC audit",
  points = 50,
  badge = null,
  variant = null
} = {}) {
  // If variant not specified, pick randomly from available delightful animations
  const chosenVariant = variant && CELEBRATION_VARIANTS.includes(variant)
    ? variant
    : CELEBRATION_VARIANTS[Math.floor(Math.random() * CELEBRATION_VARIANTS.length)];

  // Also trigger confetti bursts for high energy
  triggerConfetti();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('eco-celebration', {
      detail: {
        id: Date.now() + Math.random(),
        title,
        message,
        points,
        badge: badge || `+${points} EcoCredits`,
        variant: chosenVariant
      }
    }));
  }
}
