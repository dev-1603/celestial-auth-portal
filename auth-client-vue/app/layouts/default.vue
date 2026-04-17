<template>
  <div class="min-h-screen">
    <header v-if="user" class="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <span class="text-sm text-gray-600">{{ user.email }}</span>
      <button type="button" class="text-sm font-medium text-blue-600 hover:underline" @click="handleLogout">
        Log out
      </button>
    </header>
    <main class="mx-auto max-w-screen-4xl">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth();

async function handleLogout() {
  await logout();
}
</script>
