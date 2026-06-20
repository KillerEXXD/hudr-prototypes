import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameRelationshipChip } from './GameRelationshipChip'

describe('GameRelationshipChip', () => {
  it('shows BOTH Hosting and Playing when the host also plays their game', () => {
    render(<GameRelationshipChip rel="hosting" alsoPlaying />)
    expect(screen.getByText('Hosting')).toBeInTheDocument()
    expect(screen.getByText('Playing')).toBeInTheDocument()
  })

  it('shows only Hosting when the host is not playing', () => {
    render(<GameRelationshipChip rel="hosting" />)
    expect(screen.getByText('Hosting')).toBeInTheDocument()
    expect(screen.queryByText('Playing')).toBeNull()
  })

  it('shows Playing for a non-host participant', () => {
    render(<GameRelationshipChip rel="playing" />)
    expect(screen.getByText('Playing')).toBeInTheDocument()
    expect(screen.queryByText('Hosting')).toBeNull()
  })
})
