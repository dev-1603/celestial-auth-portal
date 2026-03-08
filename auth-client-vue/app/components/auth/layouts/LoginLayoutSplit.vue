<!-- components/auth/layouts/LoginLayoutSplit.vue -->


<template>
    <div class="min-h-screen flex items-center justify-center bg-slate-50">
        <div class="max-w-5xl w-full bg-white shadow-md rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
            <!-- Form side -->
            <div class="p-8 md:p-10 flex flex-col justify-center" :class="side === 'right' ? '' : 'order-2 md:order-1'">
                <EmailPasswordForm v-if="isEmailPasswordEnabled" />
                <template v-if="isEmailOtpEnabled">
                    <div class="my-4 flex items-center gap-2">
                        <div class="flex-1 border-t border-slate-200" />
                        <span class="text-xs text-slate-400 uppercase">or</span>
                        <div class="flex-1 border-t border-slate-200" />
                    </div>
                    <EmailOtpForm />
                </template>
                <template v-if="isPhoneOtpEnabled">
                    <div class="my-4 flex items-center gap-2">
                        <div class="flex-1 border-t border-slate-200" />
                        <span class="text-xs text-slate-400 uppercase">or</span>
                        <div class="flex-1 border-t border-slate-200" />
                    </div>
                    <PhoneOtpForm />
                </template>
                <template v-if="isMagicLinkEnabled">
                    <div class="my-4 flex items-center gap-2">
                        <div class="flex-1 border-t border-slate-200" />
                        <span class="text-xs text-slate-400 uppercase">or</span>
                        <div class="flex-1 border-t border-slate-200" />
                    </div>
                    <MagicLinkForm />
                </template>
                <template v-if="enabledOauthProviders.length">
                    <div class="my-4 flex items-center gap-2">
                        <div class="flex-1 border-t border-slate-200" />
                        <span class="text-xs text-slate-400 uppercase">or</span>
                        <div class="flex-1 border-t border-slate-200" />
                    </div>
                    <OauthButtons />
                </template>
            </div>

            <!-- Side panel -->
            <!-- <div class="hidden md:flex items-center justify-center bg-slate-900/90 text-white"
                :class="side === 'right' ? '' : 'order-1 md:order-2'">
                <div class="max-w-xs text-center space-y-4">
                    <QrLoginPanel />
                    <p class="text-sm text-white/80">
                        Open the Celestial App on your phone to scan and log in instantly.
                    </p>
                </div>
            </div> -->
        </div>
    </div>
</template>

<script setup lang="ts">
import EmailPasswordForm from "../EmailPasswordForm.vue";
import OauthButtons from "../OauthButtons.vue";
import EmailOtpForm from "../EmailOtpForm.vue";
import PhoneOtpForm from "../PhoneOtpForm.vue";
import MagicLinkForm from "../MagicLinkForm.vue";

const props = defineProps<{ side?: "left" | "right" }>();
const side = props.side ?? "right";

const { isEmailPasswordEnabled } = useAuth();
const { enabledProviders: enabledOauthProviders } = useOauth();
const { isEmailOtpEnabled } = useOtp();
const { isPhoneOtpEnabled } = usePhoneOtp();
const { isMagicLinkEnabled } = useMagicLink();
</script>
