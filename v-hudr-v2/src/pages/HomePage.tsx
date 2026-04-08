import ThemeSwitcher from '@/components/layout/ThemeSwitcher'
import { useTheme } from '@/contexts/ThemeContext'
import PulseHome from './modes/PulseHome'
import NexusHome from './modes/NexusHome'
import OracleHome from './modes/OracleHome'
import AtlasHome from './modes/AtlasHome'
import PrismHome from './modes/PrismHome'

export default function HomePage() {
  const { mode } = useTheme()

  const ModeComponent = (() => {
    switch (mode) {
      case 'pulse': return PulseHome
      case 'nexus': return NexusHome
      case 'oracle': return OracleHome
      case 'atlas': return AtlasHome
      case 'prism': return PrismHome
    }
  })()

  return (
    <div className="space-y-4">
      <ThemeSwitcher />
      <ModeComponent />
    </div>
  )
}
