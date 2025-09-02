"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Clock, CalendarIcon, MapPin, Search, Filter, ChevronDown, Users } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Extended mock data for games view
const allGames = [
  // Live Games
  {
    id: 1,
    homeTeam: "ZSC Lions",
    awayTeam: "HC Davos",
    homeScore: 2,
    awayScore: 1,
    status: "live",
    period: "2nd Period",
    timeRemaining: "12:34",
    league: "NLA",
    venue: "Hallenstadion Zürich",
    date: new Date(),
  },
  {
    id: 2,
    homeTeam: "Floorball Köniz",
    awayTeam: "UHC Alligator Malans",
    homeScore: 0,
    awayScore: 3,
    status: "live",
    period: "3rd Period",
    timeRemaining: "05:22",
    league: "NLA",
    venue: "Sporthalle Köniz",
    date: new Date(),
  },
  // Today's Games
  {
    id: 3,
    homeTeam: "Unihockey Basel Regio",
    awayTeam: "SV Wiler-Ersigen",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    startTime: "19:30",
    league: "NLA",
    venue: "Sporthalle Basel",
    date: new Date(),
  },
  {
    id: 4,
    homeTeam: "UHC Thun",
    awayTeam: "Floorball Thurgau",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    startTime: "20:00",
    league: "NLB",
    venue: "Grabenhalle Thun",
    date: new Date(),
  },
  // Recent Games
  {
    id: 5,
    homeTeam: "Grasshopper Club",
    awayTeam: "UHC Dietlikon",
    homeScore: 4,
    awayScore: 2,
    status: "finished",
    league: "NLA",
    venue: "GC Campus",
    date: new Date(Date.now() - 86400000), // Yesterday
  },
  {
    id: 6,
    homeTeam: "UHC Waldkirch-St.Gallen",
    awayTeam: "Floorball Fribourg",
    homeScore: 1,
    awayScore: 5,
    status: "finished",
    league: "NLA",
    venue: "Sporthalle Waldkirch",
    date: new Date(Date.now() - 86400000),
  },
  // Upcoming Games
  {
    id: 7,
    homeTeam: "UHC Uster",
    awayTeam: "Kloten-Dietlikon Jets",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    startTime: "18:00",
    league: "NLB",
    venue: "Sporthalle Uster",
    date: new Date(Date.now() + 86400000), // Tomorrow
  },
]

export default function GamesPage() {
  const [selectedLeague, setSelectedLeague] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date())
  const [expandedGame, setExpandedGame] = useState<number | null>(null)

  // Filter games based on selected criteria
  const filteredGames = allGames.filter((game) => {
    const matchesLeague = selectedLeague === "all" || game.league.toLowerCase() === selectedLeague
    const matchesSearch =
      searchTerm === "" ||
      game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesLeague && matchesSearch
  })

  // Categorize games
  const liveGames = filteredGames.filter((game) => game.status === "live")
  const todaysGames = filteredGames.filter(
    (game) => game.status === "scheduled" && game.date.toDateString() === new Date().toDateString(),
  )
  const recentGames = filteredGames.filter(
    (game) => game.status === "finished" && game.date.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
  )
  const upcomingGames = filteredGames.filter(
    (game) => game.status === "scheduled" && game.date.getTime() > Date.now() + 24 * 60 * 60 * 1000, // More than 1 day ahead
  )

  const GameCard = ({ game }: { game: (typeof allGames)[0] }) => {
    const isExpanded = expandedGame === game.id

    return (
      <Link href={game.status === "live" ? `/games/${game.id}` : "#"}>
        <Card
          className={cn(
            "hover:shadow-lg transition-all cursor-pointer",
            game.status === "live" && "border-primary/50 bg-primary/5",
          )}
          onClick={() => game.status !== "live" && setExpandedGame(isExpanded ? null : game.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {game.status === "live" && (
                  <Badge variant="destructive" className="bg-primary text-primary-foreground animate-pulse">
                    LIVE
                  </Badge>
                )}
                <Badge variant="outline">{game.league}</Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {game.status === "live" && game.timeRemaining && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{game.timeRemaining}</span>
                  </div>
                )}
                {game.status === "scheduled" && game.startTime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{game.startTime}</span>
                  </div>
                )}
                <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{game.homeTeam}</div>
                {game.homeScore !== null && <div className="text-2xl font-bold text-primary">{game.homeScore}</div>}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{game.awayTeam}</div>
                {game.awayScore !== null && <div className="text-2xl font-bold text-primary">{game.awayScore}</div>}
              </div>

              {game.status === "live" && game.period && (
                <div className="text-xs text-muted-foreground text-center pt-2">{game.period}</div>
              )}

              {isExpanded && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{game.venue}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{format(game.date, "PPP")}</span>
                  </div>
                  {game.status === "scheduled" && (
                    <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                      <Users className="w-4 h-4 mr-2" />
                      View Team Details
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  const GameSection = ({ title, games, icon }: { title: string; games: typeof allGames; icon?: React.ReactNode }) => {
    if (games.length === 0) return null

    return (
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Badge variant="secondary" className="ml-2">
            {games.length}
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SU</span>
              </div>
              <h1 className="text-xl font-bold text-card-foreground">Swiss Unihockey Live</h1>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Filter Bar */}
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <h2 className="text-lg font-semibold text-card-foreground">Games</h2>

          <div className="grid gap-4 md:grid-cols-4">
            {/* League Selector */}
            <Select value={selectedLeague} onValueChange={setSelectedLeague}>
              <SelectTrigger>
                <SelectValue placeholder="Select League" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leagues</SelectItem>
                <SelectItem value="nla">NLA</SelectItem>
                <SelectItem value="nlb">NLB</SelectItem>
                <SelectItem value="1liga">1. Liga</SelectItem>
              </SelectContent>
            </Select>

            {/* Team Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange ? format(dateRange, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateRange} onSelect={setDateRange} initialFocus />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSelectedLeague("all")
                setSearchTerm("")
                setDateRange(new Date())
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Games Sections */}
        <div className="space-y-8">
          <GameSection
            title="Live Games"
            games={liveGames}
            icon={<div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>}
          />

          <GameSection
            title="Today's Games"
            games={todaysGames}
            icon={<Clock className="w-5 h-5 text-muted-foreground" />}
          />

          <GameSection
            title="Recent Results"
            games={recentGames}
            icon={<CalendarIcon className="w-5 h-5 text-muted-foreground" />}
          />

          <GameSection
            title="Upcoming Games"
            games={upcomingGames}
            icon={<CalendarIcon className="w-5 h-5 text-muted-foreground" />}
          />
        </div>

        {/* No Results */}
        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-2">No games found</div>
            <div className="text-sm text-muted-foreground">Try adjusting your filters</div>
          </div>
        )}
      </main>
    </div>
  )
}
