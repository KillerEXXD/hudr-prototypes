import { AssetLoader } from './AssetLoader'
import { addReplayerBreadcrumb } from '@/lib/sentry/replayerErrors'

export type SoundEvent =
  | 'bet'
  | 'call'
  | 'check'
  | 'fold'
  | 'raise'
  | 'allin'
  | 'deal'
  | 'win'
  | 'chips-collect'
  | 'card-flip'

const soundFiles: Record<SoundEvent, string> = {
  bet: '/sounds/replayer/bet.mp3',
  call: '/sounds/replayer/call.mp3',
  check: '/sounds/replayer/check.wav', // Custom thud sound
  fold: '/sounds/replayer/fold.mp3',
  raise: '/sounds/replayer/raise.mp3',
  allin: '/sounds/replayer/allin.mp3',
  deal: '/sounds/replayer/deal.mp3',
  win: '/sounds/replayer/win.mp3',
  'chips-collect': '/sounds/replayer/chips-collect.mp3',
  'card-flip': '/sounds/replayer/card-flip.mp3',
}

export class SoundManager {
  private context: AudioContext | null = null
  private buffers = new Map<SoundEvent, AudioBuffer>()
  private enabled = true
  private volume = 0.5
  private loader = new AssetLoader()
  private initPromise: Promise<void> | null = null

  async init() {
    // No-op: AudioContext creation is deferred to first play()
    // This avoids browser warnings about AudioContext created without user gesture
  }

  private async ensureContext() {
    if (this.context) return
    if (typeof window === 'undefined') return

    // Create context on first play (triggered by user interaction)
    this.context = new AudioContext()

    // Load sound buffers
    this.initPromise = (async () => {
      await Promise.all(
        (Object.keys(soundFiles) as SoundEvent[]).map(async (key) => {
          try {
            const buffer = await this.loader.loadAudioBuffer(soundFiles[key])
            const audioBuffer = await this.context!.decodeAudioData(buffer.slice(0))
            this.buffers.set(key, audioBuffer)
          } catch (err) {
            // Use generated tone as a fallback
            this.buffers.delete(key)
            addReplayerBreadcrumb('sound_buffer_load_failed', {
              source: 'sound',
              details: { soundEvent: key, file: soundFiles[key] },
            }, 'warning')
          }
        })
      )
    })()

    try {
      await this.initPromise
    } finally {
      this.initPromise = null
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  async play(event: SoundEvent) {
    if (!this.enabled) return

    // Create AudioContext on first play (after user gesture)
    await this.ensureContext()
    if (!this.context) return

    if (this.context.state === 'suspended') {
      try {
        await this.context.resume()
      } catch (err) {
        addReplayerBreadcrumb('audio_context_resume_failed', {
          source: 'sound',
          details: { state: this.context.state },
        }, 'warning')
      }
    }
    const context = this.context

    const buffer = this.buffers.get(event)
    if (buffer) {
      const source = context.createBufferSource()
      source.buffer = buffer
      const gain = context.createGain()
      gain.gain.value = this.volume
      source.connect(gain).connect(context.destination)
      source.start(0)
      return
    }

    // Oscillator fallback if decoding failed
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'sine'
    osc.frequency.value = 440
    gain.gain.value = this.volume * 0.1
    osc.connect(gain).connect(context.destination)
    osc.start()
    osc.stop(context.currentTime + 0.12)
  }

  dispose() {
    this.context?.close()
    this.context = null
    this.initPromise = null
    this.buffers.clear()
  }
}
