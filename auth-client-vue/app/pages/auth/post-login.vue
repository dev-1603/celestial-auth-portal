<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="rounded-2xl border border-slate-200 bg-white/90 shadow-lg shadow-slate-200/60 p-8 backdrop-blur">
        <h1 class="text-2xl font-semibold tracking-tight mb-2">
          Login successful
        </h1>
        <p class="text-slate-600 mb-4">
          You’re now signed in to your workspace.
        </p>
        <p v-if="hasAutoRedirect" class="text-slate-600 mb-6">
          You’ll be redirected to your destination in
          <span class="font-semibold text-slate-900">{{ countdown }}</span>
          seconds.
        </p>
        <p v-else class="text-slate-600 mb-6">
          You can close this window or continue to your workspace when you’re ready.
        </p>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 transition-colors"
          @click="goNow"
        >
          Go to workspace
        </button>
      </div>
      <p v-if="hasAutoRedirect" class="mt-4 text-center text-xs text-slate-500">
        If you’re not redirected automatically, click the button above.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute();
const redirectAfterSeconds = 10;
const countdown = ref(redirectAfterSeconds);
const targetUrl = computed(() => {
  const fromQuery = route.query.redirect as string | undefined;
  return fromQuery && fromQuery.length > 0 ? fromQuery : null;
});
const hasAutoRedirect = computed(() => !!targetUrl.value);
let timer: ReturnType<typeof setInterval> | null = null;

const goNow = () => {
  // If we have an explicit redirect target, use it; otherwise fall back to /app.
  const dest = targetUrl.value ?? "/app";
  router.replace(dest);
};

onMounted(() => {
  if (!hasAutoRedirect.value) {
    return;
  }

  timer = setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      goNow();
    } else {
      countdown.value -= 1;
    }
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

