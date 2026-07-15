import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>General server settings, autostart, Java, delete, and account flows land here.</CardDescription>
      </CardHeader>
    </Card>
  );
}
