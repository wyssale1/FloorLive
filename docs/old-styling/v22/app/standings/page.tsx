"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Minus, Trophy, Target, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock standings data
const standingsData = {
  nla: [
    {
      position: 1,
      team: "ZSC Lions",
      gamesPlayed: 18,
      wins: 15,
      losses: 3,
      goalsFor: 89,
      goalsAgainst: 45,
      goalDifference: 44,
      points: 45,
      form: ["W", "W", "W", "L", "W"],
      zone: "promotion",
    },
    {
      position: 2,
      team: "Floorball Köniz",
      gamesPlayed: 18,
      wins: 14,
      losses: 4,
      goalsFor: 82,
      goalsAgainst: 51,
      goalDifference: 31,
      points: 42,
      form: ["W", "L", "W", "W", "W"],
      zone: "promotion",
    },
    {
      position: 3,
      team: "UHC Alligator Malans",
      gamesPlayed: 18,
      wins: 13,
      losses: 5,
      goalsFor: 76,
      goalsAgainst: 58,
      goalDifference: 18,
      points: 39,
      form: ["L", "W", "W", "L", "W"],
      zone: "promotion",
    },
    {
      position: 4,
      team: "Unihockey Basel Regio",
      gamesPlayed: 18,
      wins: 11,
      losses: 7,
      goalsFor: 71,
      goalsAgainst: 63,
      goalDifference: 8,
      points: 33,
      zone: "safe",
    },
    {
      position: 5,
      team: "SV Wiler-Ersigen",
      gamesPlayed: 18,
      wins: 10,
      losses: 8,
      goalsFor: 68,
      goalsAgainst: 67,
      goalDifference: 1,
      points: 30,
      form: ["L", "L", "W", "W", "L"],
      zone: "safe",
    },
    {
      position: 6,
      team: "Grasshopper Club",
      gamesPlayed: 18,
      wins: 9,
      losses: 9,
      goalsFor: 65,
      goalsAgainst: 70,
      goalDifference: -5,
      points: 27,
      form: ["W", "L", "L", "W", "L"],
      zone: "safe",
    },
    {
      position: 7,
      team: "UHC Dietlikon",
      gamesPlayed: 18,
      wins: 8,
      losses: 10,
      goalsFor: 59,
      goalsAgainst: 72,
      goalDifference: -13,
      points: 24,
      form: ["L", "L", "W", "L", "L"],
      zone: "safe",
    },
    {
      position: 8,
      team: "UHC Waldkirch-St.Gallen",
      gamesPlayed: 18,
      wins: 6,
      losses: 12,
      goalsFor: 52,
      goalsAgainst: 78,
      goalDifference: -26,
      points: 18,
      form: ["L", "W", "L", "L", "L"],
      zone: "relegation",
    },
    {
      position: 9,
      team: "Floorball Fribourg",
      gamesPlayed: 18,
      wins: 4,
      losses: 14,
      goalsFor: 48,
      goalsAgainst: 85,
      goalDifference: -37,
      points: 12,
      form: ["L", "L", "L", "W", "L"],
      zone: "relegation",
    },
    {
      position: 10,
      team: "UHC Uster",
      gamesPlayed: 18,
      wins: 2,
      losses: 16,
      goalsFor: 41,
      goalsAgainst: 98,
      goalDifference: -57,
      points: 6,
      form: ["L", "L", "L", "L", "L"],
      zone: "relegation",
    },
  ],
  nlb: [
    {
      position: 1,
      team: "UHC Thun",
      gamesPlayed: 16,
      wins: 14,
      losses: 2,
      goalsFor: 78,
      goalsAgainst: 32,
      goalDifference: 46,
      points: 42,
      form: ["W", "W", "W", "W", "L"],
      zone: "promotion",
    },
    {
      position: 2,
      team: "Floorball Thurgau",
      gamesPlayed: 16,
      wins: 12,
      losses: 4,
      goalsFor: 69,
      goalsAgainst: 41,
      goalDifference: 28,
      points: 36,
      form: ["W", "L", "W", "W", "W"],
      zone: "promotion",
    },
    // Add more NLB teams...
  ],
}

const topScorers = [
  { name: "Marco Müller", team: "ZSC Lions", goals: 24, assists: 18, points: 42 },
  { name: "Stefan Weber", team: "Floorball Köniz", goals: 21, assists: 19, points: 40 },
  { name: "David Schneider", team: "UHC Alligator Malans", goals: 19, assists: 16, points: 35 },
  { name: "Thomas Fischer", team: "Unihockey Basel Regio", goals: 18, assists: 15, points: 33 },
  { name: "Michael Bauer", team: "SV Wiler-Ersigen", goals: 16, assists: 17, points: 33 },
]

export default function StandingsPage() {
  const [selectedLeague, setSelectedLeague] = useState("nla")

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case "promotion":
        return "bg-green-50 border-l-4 border-l-green-500 dark:bg-green-950"
      case "relegation":
        return "bg-red-50 border-l-4 border-l-red-500 dark:bg-red-950"
      default:
        return ""
    }
  }

  const getZoneIcon = (zone: string) => {
    switch (zone) {
      case "promotion":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "relegation":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getFormIcon = (result: string) => {
    switch (result) {
      case "W":
        return (
          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            W
          </div>
        )
      case "L":
        return (
          <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            L
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            D
          </div>
        )
    }
  }

  const currentStandings = standingsData[selectedLeague as keyof typeof standingsData] || standingsData.nla

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
            <Badge variant="outline" className="hidden sm:flex">
              Season 2024/25
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">League Standings</h2>
          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select League" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nla">NLA</SelectItem>
              <SelectItem value="nlb">NLB</SelectItem>
              <SelectItem value="1liga">1. Liga</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Standings Table */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span>{selectedLeague.toUpperCase()} Standings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Pos</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">GP</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">GF</TableHead>
                        <TableHead className="text-center">GA</TableHead>
                        <TableHead className="text-center">GD</TableHead>
                        <TableHead className="text-center">Pts</TableHead>
                        <TableHead className="text-center">Form</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentStandings.map((team) => (
                        <TableRow
                          key={team.position}
                          className={cn("hover:bg-muted/50 cursor-pointer", getZoneColor(team.zone))}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <span>{team.position}</span>
                              {getZoneIcon(team.zone)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{team.team}</TableCell>
                          <TableCell className="text-center">{team.gamesPlayed}</TableCell>
                          <TableCell className="text-center">{team.wins}</TableCell>
                          <TableCell className="text-center">{team.losses}</TableCell>
                          <TableCell className="text-center">{team.goalsFor}</TableCell>
                          <TableCell className="text-center">{team.goalsAgainst}</TableCell>
                          <TableCell className="text-center">
                            <span
                              className={cn(
                                team.goalDifference > 0
                                  ? "text-green-600"
                                  : team.goalDifference < 0
                                    ? "text-red-600"
                                    : "text-muted-foreground",
                              )}
                            >
                              {team.goalDifference > 0 ? "+" : ""}
                              {team.goalDifference}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-primary">{team.points}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {team.form?.map((result, index) => (
                                <div key={index}>{getFormIcon(result)}</div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Promotion Zone</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Relegation Zone</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">
                      GP: Games Played, W: Wins, L: Losses, GF: Goals For, GA: Goals Against, GD: Goal Difference, Pts:
                      Points
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Statistics */}
          <div className="space-y-6">
            {/* Top Scorers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span>Top Scorers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topScorers.map((player, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{player.name}</div>
                        <div className="text-xs text-muted-foreground">{player.team}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{player.points}</div>
                        <div className="text-xs text-muted-foreground">
                          {player.goals}G {player.assists}A
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* League Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <span>League Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Season: 2024/25</div>
                  <div className="text-muted-foreground">Regular Season</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Teams: {currentStandings.length}</div>
                  <div className="text-muted-foreground">Top 3 advance to playoffs</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Relegation:</div>
                  <div className="text-muted-foreground">Bottom 3 teams relegated</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
