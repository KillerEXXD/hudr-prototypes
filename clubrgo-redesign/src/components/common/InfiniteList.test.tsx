import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InfiniteList } from './InfiniteList'

const render10 = (batch: number) => {
  const items = Array.from({ length: 10 }, (_, i) => `item-${i}`)
  render(<InfiniteList items={items} batch={batch} renderItem={(t) => <div key={t}>{t}</div>} />)
}

describe('InfiniteList', () => {
  it('renders only the first batch initially (the rest lazy-load on scroll)', () => {
    render10(4)
    expect(screen.getByText('item-0')).toBeInTheDocument()
    expect(screen.getByText('item-3')).toBeInTheDocument()
    expect(screen.queryByText('item-4')).toBeNull()
  })

  it('renders everything when the list is under one batch (no sentinel needed)', () => {
    render(<InfiniteList items={['a', 'b']} batch={8} renderItem={(t) => <div key={t}>{t}</div>} />)
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('b')).toBeInTheDocument()
  })
})
