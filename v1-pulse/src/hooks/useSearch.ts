import { useState, useMemo } from 'react'
import { PLAYERS } from '@/data'
import { TOURNAMENTS_LIST } from '@/data'

export function useSearch() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return { players: [], tournaments: [] }
    const q = query.toLowerCase()
    return {
      players: PLAYERS.filter(p => p.name.toLowerCase().includes(q)),
      tournaments: TOURNAMENTS_LIST.filter(t => t.name.toLowerCase().includes(q) || t.event.toLowerCase().includes(q)),
    }
  }, [query])

  return { query, setQuery, results }
}
