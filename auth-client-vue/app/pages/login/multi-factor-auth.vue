<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50">
    <div class="w-full max-w-md">
      <AuthBlocksMfaChallenge />
    </div>
  </div>
</template>

<script setup lang="ts">
import AuthBlocksMfaChallenge from '~/components/auth/blocks/MfaChallenge.vue';
</script>
