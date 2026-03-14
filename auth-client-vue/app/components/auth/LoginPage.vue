<!-- components/auth/LoginPage.vue -->
<template>
  <component :is="CurrentLayout" :side="layoutSide" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LoginLayoutSplit from './layouts/LoginLayoutSplit.vue';
import LoginLayoutCard from './layouts/LoginLayoutCard.vue';

type LoginLayoutVariant = 'split-left' | 'split-right' | 'card' | 'centered';

const props = defineProps<{ layout?: string }>();

const layout = computed<LoginLayoutVariant>(() => {
  const v = props.layout ?? 'split-right';
  return v === 'split-left' || v === 'split-right' || v === 'card' || v === 'centered'
    ? v
    : 'split-right';
});

const layoutSide = computed(() => {
  const v = layout.value;
  return v === 'split-left' ? 'left' : 'right';
});

const layoutsMap: Record<LoginLayoutVariant, any> = {
  'split-left': LoginLayoutSplit,
  'split-right': LoginLayoutSplit,
  card: LoginLayoutCard,
  centered: LoginLayoutSplit,
};

const CurrentLayout = computed(() => layoutsMap[layout.value] ?? LoginLayoutSplit);
</script>
