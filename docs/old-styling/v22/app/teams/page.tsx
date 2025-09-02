"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

// Mock teams data
const teams = [
  {
    id: "zsc-lions",
    name: "ZSC Lions",
    league: "NLA",
    position: 1,
    points: 45,
    gamesPlayed: 18,
    wins: 15,
    losses: 3,
    goalsFor: 89,
    goalsAgainst: 45,
    form: ["W", "W", "W", "L", "W"],
    logo: "/placeholder.svg?height=60&width=60&text=ZSC",
  },
  {
    id: "floorball-koniz",
    name: "Floorball Köniz",
    league: "NLA",
    position: 2,
    points: 42,
    gamesPlayed: 18,
    wins: 14,
    losses: 4,
    goalsFor: 82,
    goalsAgainst: 51,
    form: ["W", "L", "W", "W", "W"],
    logo: "/placeholder.svg?height=60&width=60&text=FK",
  },
  // Add more teams as needed
]

export default function TeamsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLeague, setSelectedLeague] = useState("all")

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLeague = selectedLeague === "all" || team.league.toLowerCase() === selectedLeague
    return matchesSearch && matchesLeague
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SU</span>
            </div>
            <h1 className="text-xl font-bold text-card-foreground">Swiss Unihockey Live</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Teams</h2>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select League" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              <SelectItem value="nla">NLA</SelectItem>
              <SelectItem value="nlb">NLB</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Teams Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{team.league}</Badge>
                    <Badge variant="secondary">#{team.position}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-4">
                    <img src={team.logo || "/placeholder.svg"} alt={team.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <h3 className="font-bold text-lg">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">{team.points} points</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                    <div>
                      <div className="font-bold">{team.wins}</div>
                      <div className="text-muted-foreground">Wins</div>
                    </div>
                    <div>
                      <div className="font-bold">{team.losses}</div>
                      <div className="text-muted-foreground">Losses</div>
                    </div>
                    <div>
                      <div className="font-bold">
                        {team.goalsFor - team.goalsAgainst > 0 ? "+" : ""}
                        {team.goalsFor - team.goalsAgainst}
                      </div>
                      <div className="text-muted-foreground">GD</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Recent Form</span>
                    <div className="flex space-x-1">
                      {team.form.map((result, index) => (
                        <div
                          key={index}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            result === "W" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
