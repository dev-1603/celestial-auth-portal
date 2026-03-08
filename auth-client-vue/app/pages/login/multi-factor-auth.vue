<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50">
    <div class="w-full max-w-md">
      <MfaForm :is-setup="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MfaForm from "../../components/auth/MfaForm.vue";
</script>
