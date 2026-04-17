<template>
  <!-- Type-driven layout used for split layout when mode === 'split'.
       Wrapped in ClientOnly to avoid SSR/client hydration mismatches from viewport-dependent logic. -->
  <ClientOnly v-if="hasSocialProviders && mode === 'split'">
    <div class="space-y-4">
      <!-- Icon-only providers (grid) -->
      <div v-if="iconOauthProviders.length || iconSsoProviders.length" class="flex gap-4 flex-wrap">
        <SocialProviderButton
          v-for="provider in iconOauthProviders"
          :key="`oauth-icon-${provider.id}`"
          :logo="provider.logo"
          :display-name="provider.displayName"
          :button-variant="provider.buttonVariant"
          icon-only
          size="lg"
          :color="provider.color"
          @click="redirectToProvider(provider.id)"
        />
        <SocialProviderButton
          v-for="provider in iconSsoProviders"
          :key="`sso-icon-${provider.id}`"
          :logo="provider.logo"
          :display-name="provider.displayName"
          icon-only
          size="lg"
          :color="provider.color"
          @click="redirectToSsoProvider(provider.id)"
        />
      </div>

      <!-- Text providers: 2-column grid on desktop/tablet, single column on mobile -->
      <div
        v-if="visibleTextProviders.length"
        :class="isMobile ? 'flex flex-col space-y-2' : 'grid grid-cols-2 gap-2'"
      >
        <SocialProviderButton
          v-for="provider in visibleTextProviders"
          :key="`${provider.isSso ? 'sso' : 'oauth'}-${provider.id}`"
          :logo="provider.logo"
          :display-name="provider.displayName"
          :label="resolveLabel(provider, isMobile ? 'long' : 'short')"
          :button-variant="provider.buttonVariant"
          :icon-only="false"
          :color="provider.color"
          size="default"
          @click="provider.isSso ? redirectToSsoProvider(provider.id) : redirectToProvider(provider.id)"
        />
      </div>

      <!-- View more / less toggle (full-width, centered text) -->
      <Button
        v-if="initialHiddenCount > 0"
        type="button"
        variant="outline"
        size="sm"
        class="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 h-8 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-input dark:text-foreground"
        @click="onToggleExpanded"
      >
        <span v-if="!showAllProviders">Show more ({{ initialHiddenCount }})</span>
        <span v-else>Show less</span>
        <Icon
          name="lucide:chevron-down"
          class="h-3 w-3 transition-transform"
          :class="showAllProviders ? 'rotate-180' : ''"
        />
      </Button>
    </div>
  </ClientOnly>

  <!-- Backwards-compatible layout used when mode === 'default' -->
  <div v-else-if="hasSocialProviders" :class="layoutClass">
    <!-- OAuth providers -->
    <SocialProviderButton v-for="provider in enabledOauthProviders" :key="`oauth-${provider.id}`" :logo="provider.logo"
      :display-name="provider.displayName" :button-variant="provider.buttonVariant" :icon-only="isGridLayout"
      :color="provider.color" :size="providerSize" @click="redirectToProvider(provider.id)" />
    <!-- SSO providers -->
    <SocialProviderButton v-for="provider in enabledSsoProviders" :key="`sso-${provider.id}`" :logo="provider.logo"
      :display-name="provider.displayName" :icon-only="isGridLayout" :color="provider.color" :size="providerSize"
      @click="redirectToSsoProvider(provider.id)" />
  </div>
</template>


<script setup lang="ts">
/**
 * Atomic block: OAuth / SSO provider buttons.
 * Uses Icon component for logos (Iconify: logos:*, simple-icons:*, lucide:*).
 *
 * Modes:
 * - default: previous behavior (layoutClass + iconOnly via grid)
 * - split: type-driven layout based on viewport (icon / short / long)
 */
import { useOauth } from '~/composables/useOauth';
import { useSso } from '~/composables/useSso';
import SocialProviderButton from '../SocialProviderButton.vue';
import { Button } from '@/components/ui/button';

type ProviderSize = 'default' | 'lg';
type Mode = 'default' | 'split';
type DisplayType = 'icon' | 'short' | 'long';

const props = withDefaults(
  defineProps<{
    layoutClass?: string;
    providerSize?: ProviderSize;
    mode?: Mode;
  }>(),
  {
    layoutClass: 'flex flex-col space-y-3',
    providerSize: 'default',
    mode: 'default',
  }
);

const { enabledProviders: enabledOauthProviders, redirectToProvider } = useOauth();
const { enabledSsoProviders, redirectToSsoProvider } = useSso();

const hasSocialProviders = computed(
  () => enabledOauthProviders.value.length > 0 || enabledSsoProviders.value.length > 0
);

// --- Split layout: type-driven grouping (icon / short / long) ---
const { width, resolveIconOnly, isMobile } = useCelestialViewport();

function getDisplayType(
  provider: { iconOnly?: string | boolean; customDisplayName?: string },
): DisplayType {
  const iconOnly = resolveIconOnly(provider.iconOnly ?? false).value;
  if (iconOnly) return 'icon';

  // Phase 1: ignore customDisplayName, use displayName everywhere.
  // Layout choice is purely viewport-driven.
  return isMobile.value ? 'long' : 'short';
}

function resolveLabel(
  provider: { displayName: string; customDisplayName?: string },
  type: DisplayType,
): string {
  const base = provider.displayName ?? '';
  // Phase 1: ignore customDisplayName, always use displayName.
  return base;
}

const iconOauthProviders = computed(() =>
  enabledOauthProviders.value.filter((p: any) => getDisplayType(p) === 'icon'),
);
const iconSsoProviders = computed(() =>
  enabledSsoProviders.value.filter((p: any) => getDisplayType(p) === 'icon'),
);

type AnyProvider = {
  id: string;
  displayName: string;
  logo: string;
  buttonVariant?: string;
  color?: string;
  isSso?: boolean;
  iconOnly?: string | boolean;
};

const allTextProviders = computed<AnyProvider[]>(() => [
  ...enabledOauthProviders.value
    .filter((p: any) => getDisplayType(p) !== 'icon')
    .map((p: any) => ({ ...p, isSso: false })),
  ...enabledSsoProviders.value
    .filter((p: any) => getDisplayType(p) !== 'icon')
    .map((p: any) => ({ ...p, isSso: true })),
]);

const SHOW_LIMIT_SINGLE_COLUMN = 3;
const SHOW_LIMIT_TWO_COLUMN = 4;
const showAllProviders = ref(false);

const emit = defineEmits<{
  (e: 'expanded-change', expanded: boolean): void;
}>();

const collapsedLimit = computed(() =>
  isMobile.value ? SHOW_LIMIT_SINGLE_COLUMN : SHOW_LIMIT_TWO_COLUMN,
);

const visibleTextProviders = computed<AnyProvider[]>(() =>
  showAllProviders.value
    ? allTextProviders.value
    : allTextProviders.value.slice(0, collapsedLimit.value),
);

const initialHiddenCount = computed(() =>
  Math.max(allTextProviders.value.length - collapsedLimit.value, 0),
);

function onToggleExpanded() {
  showAllProviders.value = !showAllProviders.value;
  emit('expanded-change', showAllProviders.value);
}

// --- Default mode: backwards-compatible behavior (layoutClass + grid) ---
const isGridLayout = computed(
  () => props.layoutClass?.includes('grid') ?? false
);
</script>
