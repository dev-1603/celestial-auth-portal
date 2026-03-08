<template>
  <div class="min-h-screen flex items-center justify-center p-4 w-full">
    <Card
      class="w-full max-w-[440px] p-10 md:p-12 rounded-2xl border border-[#e5eaf2] bg-white shadow-elevated"
    >
      <!-- Header: icon + subtitle + title + description -->
      <div class="flex flex-col items-center mb-10">
        <div
          class="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-100"
        >
          <svg
            class="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
            />
          </svg>
        </div>
        <h2 class="text-sm font-semibold text-slate-500 tracking-wide mb-1">
          Celestial Auth Portal
        </h2>
        <CardTitle class="text-2xl font-bold text-slate-900 mb-1">
          Login
        </CardTitle>
        <CardDescription class="text-[15px] text-slate-400">
          Access your workspace
        </CardDescription>
      </div>

      <CardContent class="p-0 space-y-5">
        <Form
          :validation-schema="loginSchema"
          :initial-values="{ email: '', password: '', rememberMe: false }"
          @submit="onSubmit"
          class="space-y-5"
        >
          <FormField name="email" v-slot="{ field }">
            <FormItem>
              <FormLabel class="text-[13px] font-medium text-slate-700 ml-1">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  v-bind="field"
                  type="email"
                  placeholder="name@example.com"
                  class="w-full px-4 py-3 rounded-lg text-[15px] h-auto"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="password" v-slot="{ field }">
            <FormItem>
              <div class="flex justify-between items-center px-1">
                <FormLabel class="text-[13px] font-medium text-slate-700">
                  Password
                </FormLabel>
                <NuxtLink
                  to="/forgot-password"
                  class="text-[13px] font-medium text-blue-600 hover:underline"
                >
                  Forgot?
                </NuxtLink>
              </div>
              <FormControl>
                <Input
                  v-bind="field"
                  type="password"
                  placeholder="••••••••"
                  class="w-full px-4 py-3 rounded-lg text-[15px] h-auto"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="rememberMe" v-slot="{ field }">
            <FormItem class="flex items-center px-1">
              <div class="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  :model-value="field.value"
                  @update:model-value="field.handleChange"
                />
              <Label
                for="remember"
                class="text-[13px] text-slate-500 cursor-pointer font-normal"
              >
                Remember me
              </Label>
            </div>
            </FormItem>
          </FormField>

          <Button
            type="submit"
            class="w-full py-3 font-semibold rounded-lg shadow-sm h-auto"
          >
            Continue to Workspace
          </Button>
        </Form>

        <div class="flex items-center my-8">
          <Separator class="flex-1" />
          <span
            class="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest"
          >
            or
          </span>
          <Separator class="flex-1" />
        </div>

        <div class="grid grid-cols-3 gap-3 mb-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            class="h-auto py-2.5 rounded-lg border-slate-200 hover:bg-slate-50"
          >
            <img
              src="https://www.gstatic.com/images/branding/product/1x/gsa_48dp.png"
              class="w-5 h-5"
              alt="Google"
            />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            class="h-auto py-2.5 rounded-lg border-slate-200 hover:bg-slate-50"
          >
            <svg
              class="w-5 h-5 text-[#00a4ef]"
              fill="currentColor"
              viewBox="0 0 23 23"
            >
              <path
                d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z"
              />
            </svg>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            class="h-auto py-2.5 rounded-lg border-slate-200 hover:bg-slate-50"
          >
            <svg
              class="w-5 h-5 text-slate-900"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              />
            </svg>
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          class="w-full py-3 font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 mb-8 h-auto"
        >
          <svg
            class="w-4 h-4 mr-2 text-slate-400 inline-block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Log in with SSO
        </Button>

        <p
          class="text-[11px] text-center text-slate-400 leading-relaxed max-w-[280px] mx-auto"
        >
          By continuing, you agree to the
          <a href="#" class="text-slate-600 font-medium">Terms</a>
          and
          <a href="#" class="text-slate-600 font-medium">Privacy Policy</a>.
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

const loginSchema = toTypedSchema(loginFormSchema);

type LoginValues = z.infer<typeof loginFormSchema>;

function onSubmit(values: LoginValues) {
  // Wire to your auth service using values.email, values.password, values.rememberMe
}
</script>

<style scoped>
.bg-gradient-soft {
  background: radial-gradient(
    circle at top left,
    #f1f4ff 0%,
    #f8fafc 100%
  );
}
.shadow-elevated {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.03),
    0 10px 10px -5px rgba(0, 0, 0, 0.02);
}
</style>
