<!-- pages/auth/login.vue -->
<template>
    <!-- pick layout variant -->
    <LoginPage :layout="layout" />
</template>

<script setup lang="ts">
import { brandConfig, type BrandConfig } from "../../../config";
import { computed } from "vue";
const layout  = computed(() => brandConfig.templates.login);
</script>