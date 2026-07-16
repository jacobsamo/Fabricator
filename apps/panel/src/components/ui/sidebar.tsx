import * as React from "react";

import { cn } from "@/lib/utils";

function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return <aside data-slot="sidebar" className={cn("flex h-screen w-[216px] shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground", className)} {...props} />;
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" className={cn("flex h-[57px] items-center gap-3 border-b border-border px-4", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-content" className={cn("flex flex-1 flex-col", className)} {...props} />;
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-footer" className={cn("flex flex-col gap-2 border-t border-border p-3", className)} {...props} />;
}

function SidebarSection({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-section" className={cn("border-b border-border p-3", className)} {...props} />;
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav data-slot="sidebar-menu" className={cn("flex flex-1 flex-col gap-1 p-3", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-menu-item" className={cn("flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground/45", className)} {...props} />;
}

export { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarSection };
