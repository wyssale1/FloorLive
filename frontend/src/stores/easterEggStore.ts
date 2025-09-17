import { create } from 'zustand'

interface EasterEggSequence {
  step: number
  playerId?: string
  timestamp?: number
}

interface EasterEggState {
  // Crown easter egg state
  crownUnlocked: boolean
  crownCooldown: boolean
  sequence: EasterEggSequence

  // Floorball rain easter egg state
  floorballRainActive: boolean
  floorballRainCooldown: boolean
  floorballSequence: EasterEggSequence

  // Actions
  unlockCrown: () => void
  lockCrown: () => void
  setSequenceStep: (step: number, playerId?: string) => void
  resetSequence: () => void

  // Floorball rain actions
  triggerFloorballRain: () => void
  setFloorballSequenceStep: (step: number, playerId?: string) => void
  resetFloorballSequence: () => void
  endFloorballRain: () => void
  setFloorballCooldown: (active: boolean) => void
}

export const useEasterEggStore = create<EasterEggState>()((set, get) => ({
  // Initial state - completely resets on page reload (no persistence)
  crownUnlocked: false,
  crownCooldown: false,
  sequence: { step: 0 },

  // Floorball rain initial state
  floorballRainActive: false,
  floorballRainCooldown: false,
  floorballSequence: { step: 0 },

  // Actions
  unlockCrown: () => {
    set({ crownUnlocked: true, crownCooldown: true })
    get().resetSequence()

    // Hide crown after 10 seconds and start 10 second cooldown
    setTimeout(() => {
      get().lockCrown()
      setTimeout(() => {
        set({ crownCooldown: false })
      }, 10000) // 10 second cooldown
    }, 10000) // Crown visible for 10 seconds
  },

  lockCrown: () => {
    set({ crownUnlocked: false })
  },

  setSequenceStep: (step: number, playerId?: string) => {
    // Only allow progression for specific player ID and when not in cooldown
    if (playerId === '423870' && !get().crownCooldown) {
      set({
        sequence: {
          step,
          playerId,
          timestamp: Date.now()
        }
      })

      // Auto-reset sequence after 30 seconds if not completed
      setTimeout(() => {
        const currentSequence = get().sequence
        if (currentSequence.step === step && currentSequence.timestamp) {
          const timeDiff = Date.now() - currentSequence.timestamp
          if (timeDiff >= 30000) {
            get().resetSequence()
          }
        }
      }, 30000)
    }
  },

  resetSequence: () => {
    set({ sequence: { step: 0 } })
  },

  // Floorball rain actions
  triggerFloorballRain: () => {
    set({ floorballRainActive: true, floorballRainCooldown: true })
    get().resetFloorballSequence()
    // No artificial timeouts - let the animation control its own lifecycle
  },

  setFloorballSequenceStep: (step: number, playerId?: string) => {
    // Only allow progression for specific player ID and when not in cooldown
    if (playerId === '427708' && !get().floorballRainCooldown) {
      set({
        floorballSequence: {
          step,
          playerId,
          timestamp: Date.now()
        }
      })

      // Trigger rain if sequence completed (step 2: jersey number -> profile image)
      if (step === 2) {
        get().triggerFloorballRain()
      }

      // Auto-reset sequence after 30 seconds if not completed
      setTimeout(() => {
        const currentSequence = get().floorballSequence
        if (currentSequence.step === step && currentSequence.timestamp) {
          const timeDiff = Date.now() - currentSequence.timestamp
          if (timeDiff >= 30000) {
            get().resetFloorballSequence()
          }
        }
      }, 30000)
    }
  },

  resetFloorballSequence: () => {
    set({ floorballSequence: { step: 0 } })
  },

  endFloorballRain: () => {
    set({ floorballRainActive: false })
  },

  setFloorballCooldown: (active: boolean) => {
    set({ floorballRainCooldown: active })
  }
}))