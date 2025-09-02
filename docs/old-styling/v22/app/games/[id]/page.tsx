"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Target, Square, Circle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Mock game data - in real app this would come from API
const gameData = {
  "1": {
    id: 1,
    homeTeam: "ZSC Lions",
    awayTeam: "HC Davos",
    homeScore: 2,
    awayScore: 1,
    status: "live",
    period: "2nd Period",
    timeRemaining: "12:34",
    totalTime: "20:00",
    league: "NLA",
    venue: "Hallenstadion Zürich",
    date: new Date(),
    attendance: 8542,
    referee: "Thomas Müller",
    homeTeamLogo: "/zsc-lions-logo.png",
    awayTeamLogo: "/hc-davos-logo.png",
    events: [
      {
        id: 1,
        time: "38:15",
        period: "2nd",
        type: "goal",
        team: "home",
        player: "Marco Lehmann",
        assist: "Thomas Weber",
        description: "Goal",
      },
      {
        id: 2,
        time: "35:42",
        period: "2nd",
        type: "penalty",
        team: "away",
        player: "Stefan Müller",
        duration: "2min",
        reason: "Tripping",
        description: "2min Strafe",
      },
      {
        id: 3,
        time: "28:33",
        period: "2nd",
        type: "goal",
        team: "home",
        player: "David Schneider",
        assist: "Lukas Fischer",
        description: "Goal",
      },
      {
        id: 4,
        time: "22:18",
        period: "1st",
        type: "penalty",
        team: "home",
        player: "Andreas Meier",
        duration: "2min",
        reason: "High stick",
        description: "2min Strafe",
      },
      {
        id: 5,
        time: "15:07",
        period: "1st",
        type: "goal",
        team: "away",
        player: "Michael Bauer",
        assist: "Patrick Keller",
        description: "Goal",
      },
      {
        id: 6,
        time: "20:00",
        period: "1st",
        type: "period_end",
        description: "1. Drittel beendet 2-1",
      },
    ],
  },
  "2": {
    id: 2,
    homeTeam: "Floorball Köniz",
    awayTeam: "UHC Alligator Malans",
    homeScore: 0,
    awayScore: 3,
    status: "live",
    period: "3rd Period",
    timeRemaining: "05:22",
    totalTime: "20:00",
    league: "NLA",
    venue: "Sporthalle Köniz",
    homeTeamLogo: "/floorball-k-niz-logo.png",
    awayTeamLogo: "/uhc-alligator-malans-logo.png",
    events: [],
  },
}

export default function GameDetailPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [showFloatingBack, setShowFloatingBack] = useState(false)

  const game = gameData[gameId as keyof typeof gameData]

  useEffect(() => {
    if (!game || game.status !== "live") return

    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [game])

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingBack(window.scrollY >= 100)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const getPeriodProgress = () => {
    if (!game.timeRemaining || !game.totalTime) return 0
    const [minutes, seconds] = game.timeRemaining.split(":").map(Number)
    const [totalMinutes] = game.totalTime.split(":").map(Number)
    const remainingSeconds = minutes * 60 + seconds
    const totalSeconds = totalMinutes * 60
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100
  }

  const getCurrentPeriod = () => {
    if (game.period.includes("1st")) return 1
    if (game.period.includes("2nd")) return 2
    if (game.period.includes("3rd")) return 3
    return 1
  }

  const renderEvent = (event: any) => {
    if (event.type === "goal") {
      return (
        <div key={event.id} className="flex items-center py-3 border-b border-border last:border-b-0">
          <div className="w-12 text-right text-sm font-medium text-muted-foreground mr-4">{event.time}</div>
          <div className="w-8 flex justify-center mr-4">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{event.player}</div>
            {event.assist && <div className="text-xs text-muted-foreground">Assist: {event.assist}</div>}
          </div>
        </div>
      )
    }

    if (event.type === "penalty") {
      return (
        <div key={event.id} className="flex items-center py-3 border-b border-border last:border-b-0">
          <div className="w-12 text-right text-sm font-medium text-muted-foreground mr-4">{event.time}</div>
          <div className="w-8 flex justify-center mr-4">
            <Square className="w-4 h-4 text-yellow-500 fill-yellow-500 rounded-sm" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{event.player}</div>
            <div className="text-xs text-muted-foreground">
              {event.duration} - {event.reason}
            </div>
          </div>
        </div>
      )
    }

    if (event.type === "period_end") {
      return (
        <div key={event.id} className="flex items-center py-4 border-b border-border last:border-b-0 bg-gray-50">
          <div className="w-12 mr-4"></div>
          <div className="w-8 flex justify-center mr-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-center">{event.description}</div>
          </div>
        </div>
      )
    }

    return null
  }

  const handleTeamClick = (teamName: string) => {
    const teamSlug = teamName.toLowerCase().replace(/\s+/g, "-")
    router.push(`/teams/${teamSlug}`)
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Game Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested game could not be found.</p>
          <Button onClick={() => router.push("/")}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {showFloatingBack && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-20 left-4 z-40"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.back()}
              className="shadow-lg bg-white/95 backdrop-blur-sm border"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        className="bg-card border-b border-border sticky top-16 z-30"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-6">
              <motion.button
                onClick={() => handleTeamClick(game.homeTeam)}
                className="flex flex-col items-center hover:opacity-80 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                layoutId={`home-team-${game.id}`}
              >
                <motion.img
                  src={game.homeTeamLogo || "/placeholder.svg"}
                  alt={game.homeTeam}
                  className="w-12 h-12 rounded-full"
                  layoutId={`home-logo-${game.id}`}
                />
                <motion.span
                  className="text-sm font-medium mt-2 max-w-20 truncate text-center"
                  layoutId={`home-name-${game.id}`}
                >
                  {game.homeTeam}
                </motion.span>
              </motion.button>

              <motion.div
                className="text-center"
                layoutId={`score-${game.id}`}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.div
                  className="text-3xl font-bold"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  {game.homeScore} - {game.awayScore}
                </motion.div>
                <motion.div
                  className="flex items-center justify-center space-x-2 mt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {[1, 2, 3].map((period) => (
                    <motion.div key={period} className="flex flex-col items-center" whileHover={{ scale: 1.1 }}>
                      <div className="flex items-center">
                        <Circle
                          className={`${
                            getCurrentPeriod() === period
                              ? "w-4 h-4 text-red-500 fill-red-500"
                              : getCurrentPeriod() > period
                                ? "w-3 h-3 text-green-500 fill-green-500"
                                : "w-3 h-3 text-gray-300 fill-gray-300"
                          } transition-all duration-200`}
                        />
                      </div>
                      {getCurrentPeriod() === period && (
                        <motion.div
                          className="w-8 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden"
                          initial={{ opacity: 0, scaleX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                        >
                          <motion.div
                            className="h-full bg-red-500 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${getPeriodProgress()}%` }}
                            transition={{
                              duration: 1,
                              ease: "easeOut",
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: "reverse",
                              repeatDelay: 2,
                            }}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              <motion.button
                onClick={() => handleTeamClick(game.awayTeam)}
                className="flex flex-col items-center hover:opacity-80 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                layoutId={`away-team-${game.id}`}
              >
                <motion.img
                  src={game.awayTeamLogo || "/placeholder.svg"}
                  alt={game.awayTeam}
                  className="w-12 h-12 rounded-full"
                  layoutId={`away-logo-${game.id}`}
                />
                <motion.span
                  className="text-sm font-medium mt-2 max-w-20 truncate text-center"
                  layoutId={`away-name-${game.id}`}
                >
                  {game.awayTeam}
                </motion.span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                <div className="absolute left-16 top-0 bottom-0 w-px bg-border"></div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, staggerChildren: 0.03 }}
                >
                  {game.events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.4 + index * 0.03,
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    >
                      {renderEvent(event)}
                    </motion.div>
                  ))}
                </motion.div>

                {game.events.length === 0 && (
                  <motion.div
                    className="text-center py-12 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    No events yet
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
