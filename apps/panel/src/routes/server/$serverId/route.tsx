import { Outlet } from "@tanstack/react-router";

export function ServerLayout() {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5">
      <Outlet />
    </section>
  );
}
