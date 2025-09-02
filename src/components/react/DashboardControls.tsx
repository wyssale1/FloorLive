import { useState } from "react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RefreshCw } from "lucide-react";

export function DashboardControls() {
  const [selectedLeague, setSelectedLeague] = useState("all");

  const handleRefresh = () => {
    // In a real app, this would trigger data fetching
    window.location.reload();
  };

  return (
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
  );
}