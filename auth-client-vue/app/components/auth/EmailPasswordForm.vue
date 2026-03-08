<!-- components/auth/EmailPasswordForm.vue -->
<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm, useField } from "vee-validate";
import { loginWithPasswordSchema, type LoginWithPasswordInput } from "../../../schema/zod/authSchemas";
// import { useAuth } from "@/composables/useAuth";

const { loginWithPassword, loading, error } = useAuth();

const schema = toTypedSchema(loginWithPasswordSchema);

const { handleSubmit } = useForm<LoginWithPasswordInput>({
    validationSchema: schema
});

const { value: email, errorMessage: emailError } = useField("email");
const { value: password, errorMessage: passwordError } = useField("password");
const { value: rememberMe } = useField("rememberMe");

const onSubmit = handleSubmit(async (values) => {
    // values is validated payload
    await loginWithPassword(values);
});
</script>

<template>
    <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
            <label>Email</label>
            <input v-model="email" type="email" autocomplete="email" />
            <p v-if="emailError" class="text-red-500 text-sm">{{ emailError }}</p>
        </div>

        <div>
            <label>Password</label>
            <input v-model="password" type="password" autocomplete="current-password" />
            <p v-if="passwordError" class="text-red-500 text-sm">{{ passwordError }}</p>
            <NuxtLink to="/forgot-password" class="text-sm text-blue-600 hover:underline mt-1 block">Forgot password?</NuxtLink>
        </div>

        <label class="flex items-center gap-2 text-sm">
            <input v-model="rememberMe" type="checkbox" />
            Remember me
        </label>

        <button type="submit" :disabled="loading" class="w-full bg-blue-600 text-white py-2 rounded-md">
            <span v-if="loading">Logging in...</span>
            <span v-else>Continue to Workspace</span>
        </button>

        <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
    </form>
</template>
