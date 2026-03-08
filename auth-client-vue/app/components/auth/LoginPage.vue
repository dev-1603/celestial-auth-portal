<!-- components/auth/LoginPage.vue -->
<template>
    <component :is="CurrentLayout" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import LoginLayoutSplit from "./layouts/LoginLayoutSplit.vue";
// import LoginLayoutCentered from "./layouts/LoginLayoutCentered.vue";
// import LoginLayoutCard from "./layouts/LoginLayoutCard.vue";

type LoginLayoutVariant = "split-left" | "split-right"; // "centered" | "card"

const props = defineProps<{ layout?: LoginLayoutVariant }>();

const layout = computed<LoginLayoutVariant>(() => props.layout ?? "split-right");

const layoutsMap: Record<LoginLayoutVariant, any> = {
    "split-left": LoginLayoutSplit,
    // centered: LoginLayoutCentered,
    // card: LoginLayoutCard,
    "split-right": LoginLayoutSplit
};

const CurrentLayout = computed(() => layoutsMap[layout.value]);
</script>
