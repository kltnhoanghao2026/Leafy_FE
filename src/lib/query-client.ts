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

let onMutationSuccess: MutationSuccessHandler | null = null;

export const setMutationSuccessHandler = (
  handler: MutationSuccessHandler | null,
): void => {
  onMutationSuccess = handler;
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
  }),
});
