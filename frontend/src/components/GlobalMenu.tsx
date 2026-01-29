import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { Input } from './ui/input'
import ShortcutLinks from './ShortcutLinks'
import PlayerImage from './PlayerImage'
import { useMenu } from '../contexts/MenuContext'
import { apiClient } from '../lib/apiClient'

// Animation variants
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

const searchSectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
}


interface GlobalMenuProps {
  className?: string
}


export default function GlobalMenu({ className = '' }: GlobalMenuProps) {
  const {
    isOpen,
    searchQuery,
    isSearching,
    searchResults,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    clearSearch,
    closeMenu,
  } = useMenu()

  const [localSearchQuery, setLocalSearchQuery] = useState('')

  // Handle search input changes with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setLocalSearchQuery(query)
    setSearchQuery(query)

    if (query.trim().length >= 2) {
      setIsSearching(true)
      // Debounce API calls (300ms)
      setTimeout(async () => {
        try {
          const results = await apiClient.search(query.trim(), 20)
          setSearchResults(results)
        } catch (error) {
          console.error('Error performing search:', error)
          setSearchResults({ teams: [], players: [] })
        } finally {
          setIsSearching(false)
        }
      }, 300)
    } else {
      setSearchResults({ teams: [], players: [] })
      setIsSearching(false)
    }
  }

  // Handle clear search
  const handleClearSearch = () => {
    setLocalSearchQuery('')
    clearSearch()
  }

  // Handle escape key and body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when menu is open and store original value
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        // Restore original overflow value
        document.body.style.overflow = originalOverflow || ''
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeMenu])

  // Reset local state when menu closes
  useEffect(() => {
    if (!isOpen) {
      setLocalSearchQuery('')
    }
  }, [isOpen])

  const hasSearchResults = searchResults.teams.length > 0 || searchResults.players.length > 0
  const showSearchResults = searchQuery.trim() && (hasSearchResults || !isSearching)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`pt-6 flex flex-col h-full ${className}`}
        >
          {/* Search Section */}
          <motion.div variants={searchSectionVariants} className="mb-8 flex-shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-700 z-10" />
              <Input
                type="text"
                placeholder="Search teams and players..."
                value={localSearchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-10 bg-white/60 backdrop-blur-sm border-gray-200 text-base"
                autoComplete="off"
                style={{ fontSize: '16px' }} // Prevent iOS zoom
              />
              {localSearchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {showSearchResults ? (
                // Search Results
                <motion.div
                  key="search-results"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                >
                  {isSearching ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Searching...</div>
                    </div>
                  ) : (
                    <>
                      {searchResults.teams.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Teams</h3>
                          <div className="space-y-2">
                            {searchResults.teams.map((team) => (
                              <motion.div
                                key={team.id}
                                variants={searchSectionVariants}
                                className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-lg p-3 hover:bg-white/80 transition-colors cursor-pointer"
                                onClick={() => {
                                  // Navigate to team
                                  window.location.href = `/team/${team.id}`
                                  closeMenu()
                                }}
                              >
                                <div className="flex items-center space-x-3">
                                  {team.logoUrl ? (
                                    <img
                                      src={team.logoUrl}
                                      alt={`${team.name} logo`}
                                      className="w-8 h-8 rounded-full object-contain bg-gray-100"
                                      loading="lazy"
                                      onError={(e) => {
                                        // Fallback to initials if image fails
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center ${team.logoUrl ? 'hidden' : ''}`}>
                                    {team.name.split(' ').map((word: string) => word[0]).join('').substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{team.name}</div>
                                    <div className="text-sm text-gray-500">{typeof team.league === 'string' ? team.league : team.league?.name || 'Swiss Unihockey'}</div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.players.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Players</h3>
                          <div className="space-y-2">
                            {searchResults.players.map((player) => (
                              <motion.div
                                key={player.id}
                                variants={searchSectionVariants}
                                className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-lg p-3 hover:bg-white/80 transition-colors cursor-pointer"
                                onClick={() => {
                                  // Navigate to player
                                  window.location.href = `/player/${player.id}`
                                  closeMenu()
                                }}
                              >
                                <div className="flex items-center space-x-3">
                                  <PlayerImage
                                    player={{
                                      id: player.id,
                                      name: player.name
                                    }}
                                    size="small"
                                    className="flex-shrink-0"
                                    jerseyNumber={player.jerseyNumber}
                                    showNumberBadge={true}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{player.name}</div>
                                    <div className="text-sm text-gray-500">{typeof player.team === 'string' ? player.team : player.team?.name || 'Team not available'}</div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!hasSearchResults && (
                        <div className="text-center py-8">
                          <div className="text-gray-500">No results found for "{searchQuery}"</div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                // Shortcut Links
                <ShortcutLinks key="shortcuts" />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}