import { MutationCache, QueryClient } from "@tanstack/react-query";

export type MutationInvalidateQueryKey = readonly unknown[];

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidatesQuery?: MutationInvalidateQueryKey;
      successMessage?: string;
    };
  }
}

type MutationSuccessHandler = (message: string) => void;
type MutationErrorHandler = (error: unknown) => void;

let onMutationSuccess: MutationSuccessHandler | null = null;
let onMutationError: MutationErrorHandler | null = null;

export const setMutationSuccessHandler = (
  handler: MutationSuccessHandler | null,
): void => {
  onMutationSuccess = handler;
};

/**
 * Register a global handler called whenever a mutation fails and the mutation
 * does NOT define its own `onError` callback.
 *
 * Wire this up in App.tsx alongside setMutationSuccessHandler:
 *   setMutationErrorHandler((error) => toast.error(resolveErrorMessage(error, t)));
 */
export const setMutationErrorHandler = (
  handler: MutationErrorHandler | null,
): void => {
  onMutationError = handler;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
  mutationCache: new MutationCache({
    onSettled: async (_data, error, _variables, _context, mutation) => {
      if (mutation.meta?.invalidatesQuery) {
        await queryClient.invalidateQueries({
          queryKey: mutation.meta.invalidatesQuery,
        });
      }

      if (!error && mutation.meta?.successMessage && onMutationSuccess) {
        onMutationSuccess(mutation.meta.successMessage);
      }
    },
    onError: (error, _variables, _context, mutation) => {
      // Only fire the global handler when the mutation has no local onError defined.
      // This avoids double-toasting for mutations that already handle their own errors.
      if (!mutation.options.onError && onMutationError) {
        onMutationError(error);
      }
    },
  }),
});
