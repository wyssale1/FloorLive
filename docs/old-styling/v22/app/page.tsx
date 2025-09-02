"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, ArrowRight } from "lucide-react"
import Link from "next/link"
import { GameCard } from "@/components/game-card"

// Mock data for demonstration
const liveGames = [
  {
    id: 1,
    homeTeam: "ZSC Lions",
    awayTeam: "HC Davos",
    homeScore: 2,
    awayScore: 1,
    period: "2nd Period",
    timeRemaining: "12:34",
    league: "NLA",
    homeLogo: "/zsc-lions-logo.png",
    awayLogo: "/hc-davos-logo.png",
  },
  {
    id: 2,
    homeTeam: "Floorball Köniz",
    awayTeam: "UHC Alligator Malans",
    homeScore: 0,
    awayScore: 3,
    period: "3rd Period",
    timeRemaining: "05:22",
    league: "NLA",
    homeLogo: "/floorball-k-niz-logo.png",
    awayLogo: "/uhc-alligator-malans-logo.png",
  },
]

const todaysGames = [
  {
    id: 3,
    homeTeam: "Unihockey Basel Regio",
    awayTeam: "SV Wiler-Ersigen",
    startTime: "19:30",
    venue: "Sporthalle Basel",
    league: "NLA",
    homeLogo: "/unihockey-basel-regio-logo.png",
    awayLogo: "/sv-wiler-ersigen-logo.png",
  },
  {
    id: 4,
    homeTeam: "UHC Thun",
    awayTeam: "Floorball Thurgau",
    startTime: "20:00",
    venue: "Grabenhalle Thun",
    league: "NLB",
    homeLogo: "/uhc-thun-logo.png",
    awayLogo: "/floorball-thurgau-logo.png",
  },
]

const recentGames = [
  {
    id: 5,
    homeTeam: "Grasshopper Club",
    awayTeam: "UHC Dietlikon",
    homeScore: 4,
    awayScore: 2,
    date: "Yesterday",
    league: "NLA",
    homeLogo: "/grasshopper-club-logo.png",
    awayLogo: "/uhc-dietlikon-logo.png",
  },
]

export default function Dashboard() {
  const [selectedLeague, setSelectedLeague] = useState("all")
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const handleRefresh = () => {
    setLastUpdated(new Date())
    // In a real app, this would trigger data fetching
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger className="w-20 h-8 text-xs border-0 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="nla">NLA</SelectItem>
                  <SelectItem value="nlb">NLB</SelectItem>
                  <SelectItem value="1liga">1. Liga</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-8 w-8 p-0">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">Updated {lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 py-3 space-y-4">
        {liveGames.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <h3 className="text-sm font-semibold text-foreground">Live</h3>
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                  {liveGames.length}
                </Badge>
              </div>
              <Link href="/games">
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                  All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="bg-primary/5 rounded-lg overflow-hidden">
              {liveGames.map((game, index) => (
                <GameCard key={game.id} game={game} type="live" showBorder={false} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Today</h3>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
              {todaysGames.length} games
            </Badge>
          </div>
          <div className="bg-muted/30 rounded-lg overflow-hidden">
            {todaysGames.map((game, index) => (
              <GameCard key={game.id} game={game} type="upcoming" showBorder={false} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Recent</h3>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
              {recentGames.length} results
            </Badge>
          </div>
          <div className="bg-muted/20 rounded-lg overflow-hidden">
            {recentGames.map((game, index) => (
              <GameCard key={game.id} game={game} type="recent" showBorder={false} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
