import { useState } from "react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RefreshCw } from "lucide-react";

export function DashboardControls() {
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setLastUpdated(new Date());
    // In a real app, this would trigger data fetching
  };

  return (
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
          <div className="text-xs text-muted-foreground">
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}