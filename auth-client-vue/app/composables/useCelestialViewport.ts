/**
 * Celestial responsive engine – viewport state and iconOnly resolver.
 * SSR-safe via useBreakpoints ssrWidth: 1024 and useWindowSize initialWidth.
 */

import { useBreakpoints, useWindowSize } from '@vueuse/core';
import type { ComputedRef } from 'vue';

const CELESTIAL_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

const SSR_WIDTH = 1024;

/** Legacy matching: mobile < 768, tablet 768–1023, desktop >= 1024. */
function inferSuitable(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function useCelestialViewport() {
  const { width: winWidth, height: winHeight } = useWindowSize({
    initialWidth: SSR_WIDTH,
    initialHeight: 768,
  });
  const breakpoints = useBreakpoints(CELESTIAL_BREAKPOINTS, { ssrWidth: SSR_WIDTH });

  const width = winWidth;
  const height = winHeight;

  const isMobile = breakpoints.smaller('md');
  const isTablet = breakpoints.between('md', 'lg');
  const isDesktop = breakpoints.greaterOrEqual('lg');

  const suitable = computed(() => inferSuitable(width.value));

  /**
   * Resolves iconOnly config to boolean.
   * - true / 'always' → true
   * - false / 'never' → false
   * - lt-tablet → width < 768
   * - gt-tablet → width >= 1024
   * - lt-desktop → width < 1024
   * - gt-mobile → width >= 768
   */
  function resolveIconOnly(configValue: string | boolean | undefined): ComputedRef<boolean> {
    return computed(() => {
      if (configValue === true || configValue === 'always') return true;
      if (configValue === false || configValue === 'never') return false;
      const w = width.value;
      switch (configValue) {
        case 'lt-tablet':
          return w < 768;
        case 'gt-tablet':
          return w >= 1024;
        case 'lt-desktop':
          return w < 1024;
        case 'gt-mobile':
          return w >= 768;
        case 'mobile':
          return w < 640;
        case 'tablet':
          return w >= 640 && w < 1024;
        case 'desktop':
          return w >= 1024;
        default:
          return false;
      }
    });
  }

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    suitable,
    resolveIconOnly,
    breakpoints,
  };
}
