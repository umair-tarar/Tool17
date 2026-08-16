import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";

const root = process.cwd();

describe("password recovery flow", () => {
  it("sends reset emails to the dedicated reset route", async () => {
    const source = await readFile(
      resolve(root, "client/pages/ForgotPassword.tsx"),
      "utf8",
    );

    expect(source).toContain("redirectTo: `${window.location.origin}/reset-password`");
  });

  it("subscribes before reading the session and preserves recovery routing", async () => {
    const [authSource, appSource] = await Promise.all([
      readFile(resolve(root, "client/lib/AuthProvider.tsx"), "utf8"),
      readFile(resolve(root, "client/App.tsx"), "utf8"),
    ]);

    expect(
      authSource.indexOf("supabase.auth.onAuthStateChange"),
    ).toBeLessThan(authSource.indexOf("supabase.auth.getSession"));
    expect(authSource).toContain('event === "PASSWORD_RECOVERY"');
    expect(appSource).toContain('location.pathname !== "/reset-password"');
    expect(appSource).toContain('<Navigate to="/reset-password" replace />');
  });
});
