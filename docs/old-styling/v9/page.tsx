"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Calendar, RefreshCw, ArrowRight } from "lucide-react"
import Link from "next/link"

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
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">SU</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">Swiss Unihockey</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">Live Tracker</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger className="w-20 h-8 text-xs border-0 bg-muted">
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
          </div>
        </div>
      </header>

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
            <Card className="border-primary/20">
              <CardContent className="p-0">
                {liveGames.map((game, index) => (
                  <Link key={game.id} href={`/games/${game.id}`}>
                    <div
                      className={`flex items-center py-2 px-3 hover:bg-muted/50 transition-colors cursor-pointer ${index !== liveGames.length - 1 ? "border-b border-border" : ""}`}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="text-center min-w-[40px]">
                          <div className="text-sm font-bold text-primary">{game.homeScore}</div>
                          <div className="text-sm font-bold text-primary">{game.awayScore}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <img
                              src={game.homeLogo || "/placeholder.svg"}
                              alt=""
                              className="w-5 h-5 rounded-full shrink-0"
                            />
                            <span className="text-sm font-medium truncate">{game.homeTeam}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <img
                              src={game.awayLogo || "/placeholder.svg"}
                              alt=""
                              className="w-5 h-5 rounded-full shrink-0"
                            />
                            <span className="text-sm font-medium truncate">{game.awayTeam}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <div className="text-xs text-muted-foreground">{game.timeRemaining}</div>
                        <div className="text-xs text-muted-foreground">{game.period}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Today</h3>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
              {todaysGames.length} games
            </Badge>
          </div>
          <Card>
            <CardContent className="p-0">
              {todaysGames.map((game, index) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <div
                    className={`flex items-center py-2 px-3 hover:bg-muted/50 transition-colors cursor-pointer ${index !== todaysGames.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex items-center space-x-2 shrink-0 mr-3">
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {game.startTime}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <img
                          src={game.homeLogo || "/placeholder.svg"}
                          alt=""
                          className="w-5 h-5 rounded-full shrink-0"
                        />
                        <span className="text-sm font-medium truncate">{game.homeTeam}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <img
                          src={game.awayLogo || "/placeholder.svg"}
                          alt=""
                          className="w-5 h-5 rounded-full shrink-0"
                        />
                        <span className="text-sm font-medium truncate">{game.awayTeam}</span>
                      </div>
                    </div>
                    <div className="ml-3 shrink-0">
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                        {game.league}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Recent</h3>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
              {recentGames.length} results
            </Badge>
          </div>
          <Card>
            <CardContent className="p-0">
              {recentGames.map((game, index) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <div
                    className={`flex items-center py-2 px-3 hover:bg-muted/50 transition-colors cursor-pointer ${index !== recentGames.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5 shrink-0">
                        {game.league}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <img
                              src={game.homeLogo || "/placeholder.svg"}
                              alt=""
                              className="w-5 h-5 rounded-full shrink-0"
                            />
                            <span className="text-sm font-medium truncate">{game.homeTeam}</span>
                          </div>
                          <span className="text-sm font-bold text-primary ml-2 shrink-0">{game.homeScore}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <img
                              src={game.awayLogo || "/placeholder.svg"}
                              alt=""
                              className="w-5 h-5 rounded-full shrink-0"
                            />
                            <span className="text-sm font-medium truncate">{game.awayTeam}</span>
                          </div>
                          <span className="text-sm font-bold text-primary ml-2 shrink-0">{game.awayScore}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {game.date}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>

        <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
          Updated {lastUpdated.toLocaleTimeString()}
        </footer>
      </main>
    </div>
  )
}
