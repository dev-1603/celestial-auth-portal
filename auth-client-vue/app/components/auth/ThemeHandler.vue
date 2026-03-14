<script setup lang="ts">
/**
 * Maps brand tokens to CSS variables on :root.
 * Uses appConfigStore when available (client after fetch), else static brandConfig (SSR).
 */
import { getBrandCssVars, brandConfig } from '~/config/brandConfig';

const appConfigStore = useAppConfigStore();
const brandSource = computed(
  () => appConfigStore.brand ?? brandConfig
);
const styleContent = computed(() => {
  const vars = getBrandCssVars(brandSource.value);
  const declarations = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  return `:root {\n${declarations}\n}`;
});

useHead({
  style: [{ innerHTML: styleContent }],
});
</script>

<template>
  <!-- Theme applied via useHead; no visual output -->
  <span aria-hidden="true" class="sr-only" />
</template>
