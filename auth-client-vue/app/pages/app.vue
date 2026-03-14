<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <div class="mx-auto max-w-2xl px-4 py-10">
      <h1 class="text-2xl font-bold mb-2">Workspace</h1>
      <p class="text-slate-600 mb-6">
        You're signed in. Use the header to log out or explore the app.
      </p>
      <div
        v-if="user"
        class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Account
        </h2>
        <p class="text-slate-800 font-medium">{{ user.email }}</p>
        <p v-if="user.name" class="text-slate-600 text-sm mt-1">{{ user.name }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth();
const router = useRouter();

onMounted(() => {
  if (!user.value) {
    router.replace("/auth/login");
  }
});
</script>
