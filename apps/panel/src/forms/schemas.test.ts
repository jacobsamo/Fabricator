import { describe, expect, it } from "vitest";

import { loginFormSchema, setupFormSchema } from "@/forms/schemas";

describe("auth form schemas", () => {
  it("requires a login password", () => {
    const parsed = loginFormSchema.safeParse({ password: "" });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Enter your password.");
  });

  it("requires setup passwords to be long enough and matching", () => {
    expect(setupFormSchema.safeParse({ password: "short", confirm: "short" }).error?.issues[0]?.message).toBe("Use at least 8 characters.");
    expect(setupFormSchema.safeParse({ password: "long-enough", confirm: "different" }).error?.issues[0]?.message).toBe("Passwords must match.");
  });

  it("accepts matching setup passwords", () => {
    expect(setupFormSchema.safeParse({ password: "long-enough", confirm: "long-enough" }).success).toBe(true);
  });
});
