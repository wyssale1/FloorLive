import { createContext, useContext, useState, type ReactNode } from 'react'

// Types for menu state
interface MenuState {
  isOpen: boolean
  searchQuery: string
  isSearching: boolean
  searchResults: {
    teams: any[]
    players: any[]
  }
}

// Menu actions interface
interface MenuActions {
  openMenu: () => void
  closeMenu: () => void
  toggleMenu: () => void
  setSearchQuery: (query: string) => void
  setSearchResults: (results: { teams: any[], players: any[] }) => void
  setIsSearching: (searching: boolean) => void
  clearSearch: () => void
}

// Combined context type
interface MenuContextType extends MenuState, MenuActions {}

// Create context
const MenuContext = createContext<MenuContextType | undefined>(undefined)

// Provider component
interface MenuProviderProps {
  children: ReactNode
}

export function MenuProvider({ children }: MenuProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<{ teams: any[], players: any[] }>({
    teams: [],
    players: []
  })

  // Actions
  const openMenu = () => setIsOpen(true)
  const closeMenu = () => {
    setIsOpen(false)
    // Reset search state when closing menu
    setSearchQuery('')
    setSearchResults({ teams: [], players: [] })
    setIsSearching(false)
  }
  const toggleMenu = () => isOpen ? closeMenu() : openMenu()

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults({ teams: [], players: [] })
    setIsSearching(false)
  }

  const value: MenuContextType = {
    // State
    isOpen,
    searchQuery,
    isSearching,
    searchResults,
    // Actions
    openMenu,
    closeMenu,
    toggleMenu,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    clearSearch
  }

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  )
}

// Custom hook to use menu context
export function useMenu() {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider')
  }
  return context
}

export default MenuContext