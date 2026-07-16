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

export async function copyText(text: string | null | undefined) {
  const value = String(text ?? "").trim();
  if (!value) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall back for non-secure LAN origins where navigator.clipboard is denied.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(textarea);
    try {
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, value.length);
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  } catch {
    return false;
  }
}
