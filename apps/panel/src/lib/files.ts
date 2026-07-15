const textFileExtensions = new Set([
  "txt",
  "json",
  "properties",
  "yml",
  "yaml",
  "toml",
  "cfg",
  "conf",
  "log",
  "md",
]);

export function isTextFile(path: string | undefined | null) {
  if (!path) return false;
  const extension = path.toLowerCase().split(".").pop() || "";
  return textFileExtensions.has(extension);
}

export function parentPath(path: string) {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

export function pathBreadcrumbs(path: string) {
  const parts = path.split("/").filter(Boolean);
  const crumbs = [{ label: "server", path: "" }];
  let acc = "";
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    crumbs.push({ label: part, path: acc });
  }
  return crumbs;
}
