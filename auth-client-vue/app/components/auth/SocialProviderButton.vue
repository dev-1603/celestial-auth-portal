<script setup lang="ts">
/**
 * Celestial-signature provider button: responsive long/short/iconOnly.
 * Uses @nuxt/icon for logos (Iconify: logos:*, simple-icons:*, lucide:*).
 * Integrates useCelestialViewport for iconOnly toggling; Tooltip when iconOnly.
 */
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const props = withDefaults(
  defineProps<{
    logo: string;
    displayName: string;
    /** Optional label to render; falls back to displayName when not provided. */
    label?: string;
    buttonVariant?: string;
    /** When true, render as icon-only tile (no inline text). */
    iconOnly?: boolean;
    /** Brand color (hex) for monotone icons. Icons with built-in palette (e.g. Slack) ignore this. */
    color?: string;
    /** Icon-only size: 'default' (44px) or 'lg' (48px). */
    size?: 'default' | 'lg';
  }>(),
  { buttonVariant: 'outline', iconOnly: false, size: 'default' }
);

const showIconOnly = computed(() => props.iconOnly === true);

const variant = computed(() =>
  props.buttonVariant === 'primary' ? 'default' : 'outline'
);
const isPrimary = computed(() => props.buttonVariant === 'primary');

defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button type="button" :variant="variant" :class="[
          'font-medium',
          showIconOnly
            ? (props.size === 'lg' ? 'size-12' : 'size-11') + ' rounded-lg shrink-0 p-0'
            : 'w-full h-12 rounded-lg justify-between px-4',
          isPrimary && !showIconOnly
            ? 'border-0 hover:bg-primary/90'
            : showIconOnly && isPrimary
              ? 'border-0 hover:bg-primary/90'
              : showIconOnly
                ? 'border-slate-200 hover:bg-slate-50 dark:border-input'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-input dark:text-foreground',
        ]" :aria-label="props.label ?? displayName" @click="$emit('click')">
          <span class="flex items-center gap-3 shrink min-w-0" :class="showIconOnly ? 'justify-center' : ''">
            <Icon v-if="logo" :name="logo" size="20" class="shrink-0"
              :style="props.color ? { color: props.color } : undefined" />
            <span v-else :class="[
              'flex size-5 shrink-0 items-center justify-center rounded text-xs font-medium',
              isPrimary ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600',
            ]">
              {{ displayName.charAt(0) }}
            </span>
            <span v-if="!showIconOnly" class="truncate">{{ props.label ?? displayName }}</span>
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent v-if="showIconOnly">
        {{ props.label ?? displayName }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
