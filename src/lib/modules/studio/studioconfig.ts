// ═══════════════════════════════════════════════════════
// Studio State Store (Svelte 5 / Store Bridge)
// ═══════════════════════════════════════════════════════

import { writable, derived } from 'svelte/store';

// ─── UI State ───
export const activePanel = writable<string>('properties');
export const activeCodeTab = writable<string>('svelte');
export const previewBg = writable<string>('light');
export const toastMessage = writable<string>('');

// ─── CSS Properties ───
export const properties = writable<Record<string, string>>({});

// ─── Classes ───
export const classes = writable<string[]>([]);

// ─── Custom CSS ───
export const customCss = writable<string>('');

// ─── Generator State ───
export const activeGenerator = writable<string>('animation');

export interface AnimationConfig {
  preset: string;
  duration: number;
  delay: number;
  iterations: number | string;
  easing: string;
  direction: string;
}

export const animationConfig = writable<AnimationConfig>({
  preset: 'fadeIn',
  duration: 500,
  delay: 0,
  iterations: 1,
  easing: 'ease-in-out',
  direction: 'normal'
});

export interface TransitionConfig {
  type: string;
  duration: number;
  delay: number;
  amount: number;
  axis: string;
}

export const transitionConfig = writable<TransitionConfig>({
  type: 'fade',
  duration: 400,
  delay: 0,
  amount: 50,
  axis: 'y'
});

export interface ShadowConfig {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
}

export const shadowConfig = writable<ShadowConfig>({
  x: 0,
  y: 4,
  blur: 20,
  spread: 0,
  color: '#000000',
  opacity: 30
});

export interface MotionConfig {
  type: string;
  duration: number;
  easing: string;
  stiffness: number;
  damping: number;
  precision: number;
}

export const motionConfig = writable<MotionConfig>({
  type: 'tweened',
  duration: 500,
  easing: 'cubicOut',
  stiffness: 120,
  damping: 12,
  precision: 1
});

// ─── Theme ───
export const theme = writable<Record<string, string>>({
  '--bg': '#0f0f14',
  '--surface': '#1a1a24',
  '--accent': '#ff3e00',
  '--fg': '#e8e8f0',
  '--muted': '#8888a0',
  '--success': '#22c55e',
  '--warning': '#eab308',
  '--danger': '#ef4444'
});

export const themeFonts = writable<{ display: string; body: string; mono: string }>({
  display: "'Space Grotesk'",
  body: "'Inter'",
  mono: "'JetBrains Mono'"
});

// ─── Derived Stores ───
export const activeProperties = derived(
  properties,
  ($props) => Object.entries($props).filter(([, v]) => v)
);

export const classString = derived(
  classes,
  ($classes) => $classes.join(' ')
);

let toastTimer: ReturnType<typeof setTimeout> | undefined;

// ─── Toast helper ───
export function showToast(msg: string) {
  toastMessage.set(msg);
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    toastMessage.set('');
  }, 2000);
}

// ─── Reset helper ───
export function resetAll() {
  properties.set({});
  classes.set([]);
  customCss.set('');
  showToast('Reset complete');
}
