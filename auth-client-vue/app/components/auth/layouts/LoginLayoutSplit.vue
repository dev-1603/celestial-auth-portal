<!-- Celestial split-screen layout: sidecar for brand imagery/gradients, other side for auth forms -->
<template>
  <div class="min-h-screen flex">
    <!-- Sidecar: brand imagery / gradient -->
    <div
      :class="[
        'hidden md:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden',
        side === 'right' ? 'order-1' : 'order-2',
      ]"
      :style="sidecarStyle"
    >
      <!-- Gradient overlay for legibility over images -->
      <div
        class="absolute inset-0 z-0"
        :style="{
          background:
            brandConfig.background?.type === 'image'
              ? 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(29,78,216,0.6) 100%)'
              : undefined,
        }"
      />
      <div
        v-if="brandConfig.background?.type !== 'image'"
        class="absolute inset-0 z-0 celestial-gradient"
      />
      <div class="relative z-10 text-center text-white max-w-md space-y-6">
        <img
          v-if="logoUrl"
          :src="logoUrl"
          :alt="brandConfig.content?.companyName ?? 'Logo'"
          class="h-12 mx-auto object-contain"
        />
        <h2 class="text-2xl font-bold tracking-tight" :style="{ fontFamily: 'var(--font-heading)' }">
          {{ brandConfig.content?.companyName ?? 'Celestial Auth' }}
        </h2>
        <p class="text-white/90 text-sm leading-relaxed">
          {{ brandConfig.seo?.description ?? 'Sign in securely to your workspace.' }}
        </p>
      </div>
    </div>

    <!-- Auth form side -->
    <div
      :class="[
        'flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-[var(--surface)] min-w-0',
        side === 'right' ? 'order-2' : 'order-1',
      ]"
    >
      <div class="w-full max-w-[400px] space-y-6">
        <div class="text-center mb-8">
          <h1 class="text-xl font-semibold text-[var(--foreground)]" :style="{ fontFamily: 'var(--font-heading)' }">
            Sign in to your workspace
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Use your work email or single sign-on to continue.
          </p>
        </div>

        <AuthMethodDispatcher />

        <p class="text-[11px] text-center text-muted-foreground pt-2">
          By continuing, you agree to the
          <a :href="termsUrl" target="_blank" rel="noopener noreferrer" class="text-[var(--primary)] font-medium hover:underline">Terms</a>
          and
          <a :href="privacyUrl" target="_blank" rel="noopener noreferrer" class="text-[var(--primary)] font-medium hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AuthMethodDispatcher from '../AuthMethodDispatcher.vue';
import { brandConfig } from '~/config/brandConfig';

const props = defineProps<{ side?: 'left' | 'right' }>();
const side = props.side ?? 'right';

const termsUrl = computed(() => brandConfig.content?.termsUrl ?? '#');
const privacyUrl = computed(() => brandConfig.content?.privacyUrl ?? '#');

const logoUrl = computed(() => brandConfig.ui?.darkMode ? brandConfig.logos?.logoDark : brandConfig.logos?.logoLight);

const sidecarStyle = computed(() => {
  const bg = brandConfig.background;
  if (bg?.type === 'image' && bg?.value) {
    return {
      backgroundImage: `url(${bg.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 50%, var(--secondary) 100%)',
  };
});
</script>

<style scoped>
.celestial-gradient {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 50%, var(--secondary) 100%);
}
</style>
