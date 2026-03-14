<!-- Re-export from atomic block -->
<script setup lang="ts">
import OauthButtonsBlock from './blocks/OauthButtons.vue';

defineProps<{ layoutClass?: string; providerSize?: 'default' | 'lg' }>();
</script>

<template>
  <OauthButtonsBlock :layout-class="layoutClass" :provider-size="providerSize" />
</template>
