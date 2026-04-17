<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
    <div v-if="user" class="text-center space-y-4">
      <p class="text-slate-600">You're already signed in.</p>
      <NuxtLink to="/app"
        class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Go to Workspace
      </NuxtLink>
    </div>
    <div v-else class="text-center max-w-sm space-y-6">
      <h1 class="text-2xl font-bold text-slate-900">Celestial Auth Portal</h1>
      <p class="text-slate-600">
        Sign in to access your workspace or create an account.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <NuxtLink to="/auth/login"
          class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          Log in
        </NuxtLink>
        <NuxtLink to="/signup"
          class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Sign up
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth();
const router = useRouter();

onMounted(() => {
  if (user?.id) {
    router.replace("/app");
  }
});
</script>
