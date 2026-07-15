import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OverviewPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>Runtime metrics, status cards, install state, and recent logs land here.</CardDescription>
      </CardHeader>
    </Card>
  );
}
