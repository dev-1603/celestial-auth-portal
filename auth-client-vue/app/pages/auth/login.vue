<!-- pages/auth/login.vue -->
<template>
  <LoginPage :layout="layout" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { brandConfig } from "~/config/brandConfig";
import LoginPage from "~/components/auth/LoginPage.vue";

const layout = computed(() => brandConfig.templates?.login ?? "split-right");
</script>