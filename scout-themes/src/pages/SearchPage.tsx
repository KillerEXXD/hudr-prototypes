import { useSearch } from '@/hooks/useSearch'
import { SearchBar, SearchResults } from '@/components/search'

export default function SearchPage() {
  const { query, setQuery, results } = useSearch()

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">Search</h1>
      <SearchBar value={query} onChange={setQuery} />
      {query.trim() ? (
        <SearchResults players={results.players} tournaments={results.tournaments} />
      ) : (
        <p className="text-center text-text-muted text-sm py-8">
          Search for players, tournaments, or events
        </p>
      )}
    </div>
  )
}
