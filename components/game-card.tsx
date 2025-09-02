import { Badge } from "@/components/ui/badge"
import { Clock, Calendar } from "lucide-react"
import Link from "next/link"

interface GameCardProps {
  game: {
    id: number
    homeTeam: string
    awayTeam: string
    homeLogo: string
    awayLogo: string
    league: string
    homeScore?: number
    awayScore?: number
    startTime?: string
    date?: string
    period?: string
    timeRemaining?: string
  }
  type: "live" | "upcoming" | "recent"
  showBorder?: boolean
}

export function GameCard({ game, type, showBorder = true }: GameCardProps) {
  return (
    <Link href={`/games/${game.id}`}>
      <div
        className={`flex items-center py-3 px-4 hover:bg-background/50 transition-all duration-200 cursor-pointer ${
          type === "live" ? "hover:bg-primary/10" : type === "upcoming" ? "hover:bg-muted/50" : "hover:bg-muted/40"
        }`}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="text-center min-w-[40px]">
            {type === "live" || type === "recent" ? (
              <>
                <div
                  className={`text-sm font-bold ${type === "recent" ? "text-muted-foreground font-medium" : "text-primary"}`}
                >
                  {game.homeScore}
                </div>
                <div
                  className={`text-sm font-bold ${type === "recent" ? "text-muted-foreground font-medium" : "text-primary"}`}
                >
                  {game.awayScore}
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {game.startTime}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <img src={game.homeLogo || "/placeholder.svg"} alt="" className="w-5 h-5 rounded-full shrink-0" />
              <span
                className={`text-sm truncate ${type === "recent" ? "font-normal text-muted-foreground" : "font-medium"}`}
              >
                {game.homeTeam}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <img src={game.awayLogo || "/placeholder.svg"} alt="" className="w-5 h-5 rounded-full shrink-0" />
              <span
                className={`text-sm truncate ${type === "recent" ? "font-normal text-muted-foreground" : "font-medium"}`}
              >
                {game.awayTeam}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right ml-3 shrink-0">
          {type === "live" && (
            <>
              <div className="text-xs text-muted-foreground">{game.timeRemaining}</div>
              <div className="text-xs text-muted-foreground">{game.period}</div>
            </>
          )}
          {type === "upcoming" && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
              {game.league}
            </Badge>
          )}
          {type === "recent" && (
            <div className="text-xs text-muted-foreground flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {game.date}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
