/**
 * Notification composable – wraps shadcn-nuxt Sonner (vue-sonner) toast.
 * Works with <Toaster /> in app.vue. Use for success, error, info, warning toasts.
 */

import { toast } from "vue-sonner";

export function useNotify() {
  return {
    /** Default toast */
    show: (
      message: string,
      options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
      return toast(message, options);
    },
    /** Success toast */
    success: (message: string, options?: { description?: string }) => {
      return toast.success(message, options);
    },
    /** Error toast */
    error: (message: string, options?: { description?: string }) => {
      return toast.error(message, options);
    },
    /** Info toast */
    info: (message: string, options?: { description?: string }) => toast.info(message, options),
    /** Warning toast */
    warning: (message: string, options?: { description?: string }) => toast.warning(message, options),
    /** Loading toast */
    loading: (message: string, options?: { description?: string }) => {
      return toast.loading(message, options);
    },
    /** Promise toast */
    promise: <T>(
      promise: Promise<T>,
      options: {
        loading?: string;
        success?: string | ((data: T) => string);
        error?: string | ((err: unknown) => string);
      }
    ) => {
      return toast.promise(promise, options);
    },
    /** Dismiss toast */
    dismiss: (id?: string | number) => {
      return toast.dismiss(id);
    },
    /** Custom toast */
    custom: toast.custom,
  };
}
