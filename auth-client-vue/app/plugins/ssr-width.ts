import { provideSSRWidth } from '@vueuse/core'

export default defineNuxtPlugin((nuxtApp) => {
    provideSSRWidth(1440, nuxtApp.vueApp)
})
