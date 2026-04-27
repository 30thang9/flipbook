// src/lib/Constants.ts
import type { FlipbookOptions } from './types.ts';

/**
 * Default library options
 */
export const DEFAULT_OPTIONS: Required<FlipbookOptions> = {
  width: 800,
  height: 600,
  duration: 600,
  startPage: 1,
  showShadows: true,
  displayMode: 'single',
  animationType: 'curl',
  curlIntensity: 0.3,
  staggerStep: 0,
  totalPages: 0,
  hasCover: true,
  showShine: true,
  onInit: () => {},
  onFlip: () => {},
  pageNumbers: {
    enabled: false,
    position: 'bottom',
    alignment: 'outer',
    startAt: 1,
    firstNumber: 1,
    hideOnPages: []
  }
};

/**
 * Breakpoints for responsive behavior
 */
export const BREAKPOINTS = {
  MOBILE_MODE: 1000,
};

/**
 * Aesthetic and physical thresholds
 */
export const VISUAL_THRESHOLDS = {
  CURL_SHADOW_MAX: 0.4,
  SPINE_SHADOW_BASE: 0.5,
  SPINE_SHADOW_CURL_REDUCTION: 0.3,
  STACK_WIDTH_MAX: 6,
  STACK_STEP: 1.2,
};
