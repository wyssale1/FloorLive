import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Loader2 } from 'lucide-react'
import GameCard from './GameCard'
import type { Game } from '../lib/mockData'
import { apiClient } from '../lib/apiClient'
import type { LeagueGroupConfigItem } from '../lib/apiClient'

interface ExpandableLeagueSectionProps {
    leagueGroup: LeagueGroupConfigItem
    date: string
    index?: number
}

export default function ExpandableLeagueSection({
    leagueGroup,
    date,
    index = 0
}: ExpandableLeagueSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [games, setGames] = useState<Game[]>([])
    const [hasLoaded, setHasLoaded] = useState(false)

    const handleExpand = useCallback(async () => {
        if (isExpanded) {
            setIsExpanded(false)
            return
        }

        setIsExpanded(true)

        // Only fetch if not already loaded
        if (!hasLoaded) {
            setIsLoading(true)
            try {
                const fetchedGames = await apiClient.getLeagueGames({
                    date,
                    league: leagueGroup.id,
                    gameClass: leagueGroup.gameClass,
                    group: leagueGroup.group || undefined
                })
                setGames(fetchedGames)
                setHasLoaded(true)
            } catch (error) {
                console.error('Error fetching league games:', error)
            } finally {
                setIsLoading(false)
            }
        }
    }, [isExpanded, hasLoaded, date, leagueGroup])

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="mb-4"
        >
            {/* Single box with animated height */}
            <div className="bg-white/40 backdrop-blur-sm rounded-lg border border-gray-100 overflow-hidden">
                {/* Clickable header - always visible */}
                <button
                    onClick={handleExpand}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/60 transition-colors duration-200 group"
                >
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                        </motion.div>
                        <h2 className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                            {leagueGroup.displayName}
                        </h2>
                    </div>

                    {/* Loading or game count indicator */}
                    <div className="flex items-center gap-2">
                        {isLoading && (
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        )}
                        {hasLoaded && !isLoading && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {games.length} {games.length === 1 ? 'Spiel' : 'Spiele'}
                            </span>
                        )}
                        {!hasLoaded && !isLoading && (
                            <span className="text-xs text-gray-400">
                                Klicken zum Laden
                            </span>
                        )}
                    </div>
                </button>

                {/* Expandable content with smooth height animation */}
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="border-t border-gray-100">
                                {isLoading ? (
                                    <div className="p-6 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                        <span className="ml-2 text-gray-500">Lade Spiele...</span>
                                    </div>
                                ) : games.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        Keine Spiele an diesem Datum
                                    </div>
                                ) : (
                                    games.map((game, gameIndex) => (
                                        <div key={game.id}>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: gameIndex * 0.03 }}
                                            >
                                                <GameCard game={game} />
                                            </motion.div>
                                            {/* Separator line between games */}
                                            {gameIndex < games.length - 1 && (
                                                <div className="mx-3 border-b border-gray-100"></div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.section>
    )
}
