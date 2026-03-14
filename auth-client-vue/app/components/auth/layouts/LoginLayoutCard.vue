<!-- Card-style login layout matching reference: gradient background, single centered card, header, form, divider, social/SSO, footer -->
<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-100 from-10% via-slate-50 to-slate-200 to-90%">
    <!-- Small logo top-left -->
    <div class="absolute top-6 left-6 flex items-center">
      <svg class="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
        aria-hidden>
        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
      </svg>
    </div>

    <Card
      class="w-full max-w-[500px] rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
      <!-- Card header: shield logo + title + subtitle -->
      <div class="flex flex-col items-center pt-10 pb-6 px-8 text-center">

        <div
          class="w-14 h-14 rounded-xl bg-blue-600 flex items-center md:hidden  justify-center mb-5 shadow-lg shadow-blue-100"
          aria-hidden>
          <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
          </svg>
        </div>
        <h1 class="text-lg font-bold text-slate-900 tracking-tight md:hidden">
          Celestial Auth Portal
        </h1>
        <h2 class="text-xl font-bold text-slate-900">
          Sign in to your account
        </h2>
        <p class="text-sm text-slate-500 mt-1.5">
          Use your email or single sign-on to continue.
        </p>
      </div>

      <div class="px-8 pb-8">
        <LazyAuthMethodDispatcher />
        <p class="text-[11px] text-center text-slate-400 leading-relaxed pt-2 mt-6">
          By continuing, you agree to the
          <a :href="termsUrl" target="_blank" rel="noopener noreferrer"
            class="text-blue-600 font-medium hover:underline">
            Terms of Service
          </a>
          and
          <a :href="privacyUrl" target="_blank" rel="noopener noreferrer"
            class="text-blue-600 font-medium hover:underline">
            Privacy Policy
          </a>.
        </p>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">

import { Card } from "../../ui/card";
import { brandConfig } from "~/config/brandConfig";

const termsUrl = computed(() => brandConfig.content?.termsUrl ?? "#");
const privacyUrl = computed(() => brandConfig.content?.privacyUrl ?? "#");
</script>
