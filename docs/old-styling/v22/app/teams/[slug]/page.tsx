"use client"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock team data
const teamsData = {
  "zsc-lions": {
    id: "zsc-lions",
    name: "ZSC Lions",
    fullName: "Zürcher Schlittschuh Club Lions",
    league: "NLA",
    founded: 1930,
    homeVenue: "Hallenstadion Zürich",
    capacity: 11200,
    logo: "/zsc-lions-logo.png",
    colors: ["#FF0000", "#FFFFFF"],
    currentPosition: 1,
    totalTeams: 10,
    points: 45,
    gamesPlayed: 18,
    wins: 15,
    losses: 3,
    goalsFor: 89,
    goalsAgainst: 45,
    form: ["W", "W", "W", "L", "W"],
    recentGames: [
      {
        id: 1,
        opponent: "HC Davos",
        isHome: true,
        result: "W",
        homeScore: 2,
        awayScore: 1,
        date: "2024-01-15",
        status: "finished",
      },
      {
        id: 2,
        opponent: "Floorball Köniz",
        isHome: false,
        result: "W",
        homeScore: 1,
        awayScore: 3,
        date: "2024-01-12",
        status: "finished",
      },
      {
        id: 3,
        opponent: "UHC Alligator Malans",
        isHome: true,
        result: "W",
        homeScore: 4,
        awayScore: 2,
        date: "2024-01-08",
        status: "finished",
      },
      {
        id: 4,
        opponent: "Unihockey Basel Regio",
        isHome: false,
        result: "L",
        homeScore: 3,
        awayScore: 2,
        date: "2024-01-05",
        status: "finished",
      },
      {
        id: 5,
        opponent: "SV Wiler-Ersigen",
        isHome: true,
        result: "W",
        homeScore: 5,
        awayScore: 1,
        date: "2024-01-02",
        status: "finished",
      },
    ],
    upcomingGames: [
      {
        id: 6,
        opponent: "Grasshopper Club",
        isHome: true,
        date: "2024-01-20",
        time: "19:30",
        status: "scheduled",
      },
      {
        id: 7,
        opponent: "UHC Dietlikon",
        isHome: false,
        date: "2024-01-25",
        time: "20:00",
        status: "scheduled",
      },
      {
        id: 8,
        opponent: "UHC Waldkirch-St.Gallen",
        isHome: true,
        date: "2024-01-28",
        time: "18:00",
        status: "scheduled",
      },
    ],
    topPlayers: [
      { name: "Marco Müller", position: "Forward", goals: 24, assists: 18, points: 42 },
      { name: "Stefan Weber", position: "Forward", goals: 18, assists: 22, points: 40 },
      { name: "Thomas Keller", position: "Defender", goals: 8, assists: 25, points: 33 },
      { name: "Michael Bauer", position: "Forward", goals: 16, assists: 15, points: 31 },
    ],
  },
  "hc-davos": {
    id: "hc-davos",
    name: "HC Davos",
    fullName: "Hockey Club Davos",
    league: "NLA",
    founded: 1921,
    homeVenue: "Vaillant Arena",
    capacity: 7080,
    logo: "/hc-davos-logo.png",
    colors: ["#0066CC", "#FFFFFF"],
    currentPosition: 3,
    totalTeams: 10,
    points: 38,
    gamesPlayed: 18,
    wins: 12,
    losses: 6,
    goalsFor: 72,
    goalsAgainst: 58,
    form: ["L", "W", "W", "L", "W"],
    recentGames: [
      {
        id: 1,
        opponent: "ZSC Lions",
        isHome: false,
        result: "L",
        homeScore: 2,
        awayScore: 1,
        date: "2024-01-15",
        status: "finished",
      },
    ],
    upcomingGames: [
      {
        id: 2,
        opponent: "Floorball Köniz",
        isHome: true,
        date: "2024-01-22",
        time: "19:00",
        status: "scheduled",
      },
    ],
    topPlayers: [
      { name: "Andreas Müller", position: "Forward", goals: 18, assists: 15, points: 33 },
      { name: "Patrick Weber", position: "Forward", goals: 14, assists: 18, points: 32 },
    ],
  },
  "floorball-köniz": {
    id: "floorball-köniz",
    name: "Floorball Köniz",
    fullName: "Floorball Club Köniz",
    league: "NLA",
    founded: 1995,
    homeVenue: "Sporthalle Köniz",
    capacity: 2500,
    logo: "/floorball-k-niz-logo.png",
    colors: ["#00AA00", "#FFFFFF"],
    currentPosition: 6,
    totalTeams: 10,
    points: 28,
    gamesPlayed: 18,
    wins: 9,
    losses: 9,
    goalsFor: 65,
    goalsAgainst: 68,
    form: ["L", "L", "W", "L", "L"],
    recentGames: [
      {
        id: 1,
        opponent: "UHC Alligator Malans",
        isHome: true,
        result: "L",
        homeScore: 0,
        awayScore: 3,
        date: "2024-01-16",
        status: "finished",
      },
    ],
    upcomingGames: [
      {
        id: 2,
        opponent: "HC Davos",
        isHome: false,
        date: "2024-01-22",
        time: "19:00",
        status: "scheduled",
      },
    ],
    topPlayers: [
      { name: "Michael Schmidt", position: "Forward", goals: 15, assists: 12, points: 27 },
      { name: "Daniel Meier", position: "Forward", goals: 12, assists: 14, points: 26 },
    ],
  },
  "uhc-alligator-malans": {
    id: "uhc-alligator-malans",
    name: "UHC Alligator Malans",
    fullName: "Unihockey Club Alligator Malans",
    league: "NLA",
    founded: 1988,
    homeVenue: "Sporthalle Malans",
    capacity: 1800,
    logo: "/uhc-alligator-malans-logo.png",
    colors: ["#FF6600", "#000000"],
    currentPosition: 4,
    totalTeams: 10,
    points: 35,
    gamesPlayed: 18,
    wins: 11,
    losses: 7,
    goalsFor: 78,
    goalsAgainst: 62,
    form: ["W", "W", "L", "W", "W"],
    recentGames: [
      {
        id: 1,
        opponent: "Floorball Köniz",
        isHome: false,
        result: "W",
        homeScore: 0,
        awayScore: 3,
        date: "2024-01-16",
        status: "finished",
      },
    ],
    upcomingGames: [
      {
        id: 2,
        opponent: "Unihockey Basel Regio",
        isHome: true,
        date: "2024-01-23",
        time: "20:15",
        status: "scheduled",
      },
    ],
    topPlayers: [
      { name: "Lukas Bauer", position: "Forward", goals: 20, assists: 16, points: 36 },
      { name: "Simon Keller", position: "Forward", goals: 16, assists: 19, points: 35 },
    ],
  },
}

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teamSlug = params.slug as string

  const team = teamsData[teamSlug as keyof typeof teamsData]

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Team Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested team could not be found.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case "W":
        return "text-green-600 bg-green-50"
      case "L":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getFormIcon = (result: string) => {
    switch (result) {
      case "W":
        return (
          <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            W
          </div>
        )
      case "L":
        return (
          <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            L
          </div>
        )
      default:
        return (
          <div className="w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            D
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {team.league}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                #{team.currentPosition}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center space-x-4 p-4 bg-primary/5 rounded-lg">
          <img
            src={team.logo || "/placeholder.svg?height=60&width=60&query=team logo"}
            alt={team.name}
            className="w-16 h-16 rounded-full border-2 border-primary/20"
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{team.name}</h1>
            <p className="text-sm text-muted-foreground">{team.fullName}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{team.founded}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{team.homeVenue}</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">{team.points}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">{team.currentPosition}</div>
            <div className="text-xs text-muted-foreground">Position</div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">{team.wins}</div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">{team.goalsFor}</div>
            <div className="text-xs text-muted-foreground">Goals</div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">
              {team.goalsFor - team.goalsAgainst > 0 ? "+" : ""}
              {team.goalsFor - team.goalsAgainst}
            </div>
            <div className="text-xs text-muted-foreground">Diff</div>
          </div>
        </div>

        <div className="bg-muted/20 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground">RECENT GAMES</h3>
          <div className="space-y-2">
            {team.recentGames.slice(0, 5).map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between py-2 hover:bg-background/50 rounded transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      getResultColor(game.result),
                    )}
                  >
                    {game.result}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {game.isHome ? "vs" : "@"} {game.opponent}
                    </div>
                    <div className="text-xs text-muted-foreground">{game.date}</div>
                  </div>
                </div>
                <div className="text-sm font-bold">
                  {game.isHome ? `${game.homeScore}-${game.awayScore}` : `${game.awayScore}-${game.homeScore}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/15 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground">UPCOMING GAMES</h3>
          <div className="space-y-2">
            {team.upcomingGames.slice(0, 3).map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between py-2 hover:bg-background/50 rounded transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {game.isHome ? "vs" : "@"} {game.opponent}
                    </div>
                    <div className="text-xs text-muted-foreground">{game.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{game.time}</div>
                  <Badge variant="outline" className="text-xs">
                    {team.league}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground">TOP PLAYERS</h3>
          <div className="space-y-2">
            {team.topPlayers.slice(0, 4).map((player, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 hover:bg-background/50 rounded transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{player.name}</div>
                    <div className="text-xs text-muted-foreground">{player.position}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">{player.points}</div>
                  <div className="text-xs text-muted-foreground">
                    {player.goals}G {player.assists}A
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/25 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground">RECENT FORM</h3>
          <div className="flex items-center space-x-2">
            {team.form.map((result, index) => (
              <div key={index}>{getFormIcon(result)}</div>
            ))}
            <span className="text-xs text-muted-foreground ml-2">
              {team.wins}W {team.losses}L in {team.gamesPlayed} games
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
