import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PlayersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Players</CardTitle>
        <CardDescription>Whitelist, ops, bans, IP bans, kicks, and live players land here.</CardDescription>
      </CardHeader>
    </Card>
  );
}
