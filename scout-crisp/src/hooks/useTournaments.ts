// NOTE: This legacy v-hudr-v2 hook file is no longer used by the app
// (the app's hooks live in src/hooks/index.ts). It now only provides the
// `useInfiniteHands` stub the ported replayer's HandHistoryPanel imports —
// that panel is not opened in this prototype (no tournamentId passed).
export function useInfiniteHands(..._args: unknown[]) {
  return {
    data: undefined as { pages: { data: unknown[] }[] } | undefined,
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    isError: false,
  }
}
