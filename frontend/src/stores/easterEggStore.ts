import { create } from 'zustand'

interface EasterEggSequence {
  step: number
  playerId?: string
  timestamp?: number
}

interface EasterEggState {
  // Crown easter egg state
  crownUnlocked: boolean
  sequence: EasterEggSequence
  
  // Actions
  unlockCrown: () => void
  setSequenceStep: (step: number, playerId?: string) => void
  resetSequence: () => void
  
  // Future easter eggs can be added here
  // otherEasterEgg: boolean
  // unlockOtherEasterEgg: () => void
}

export const useEasterEggStore = create<EasterEggState>()((set, get) => ({
  // Initial state - completely resets on page reload (no persistence)
  crownUnlocked: false,
  sequence: { step: 0 },

  // Actions
  unlockCrown: () => {
    set({ crownUnlocked: true })
    get().resetSequence()
  },

  setSequenceStep: (step: number, playerId?: string) => {
    // Only allow progression for specific player ID
    if (playerId === '423870') {
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
  }
}))