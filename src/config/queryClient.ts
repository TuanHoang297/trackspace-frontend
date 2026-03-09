import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,        // 30s — data under 30s is fresh, no refetch
            gcTime: 5 * 60_000,       // 5min — cache kept in memory for 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});
