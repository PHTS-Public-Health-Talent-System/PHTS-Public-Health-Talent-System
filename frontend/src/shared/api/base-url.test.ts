import { describe, expect, it, vi } from "vitest";
import { resolveApiBaseUrl } from "@/shared/api/base-url";

describe("resolveApiBaseUrl", () => {
  it("returns absolute api url when env is already valid", () => {
    expect(resolveApiBaseUrl("http://localhost:3001/api")).toBe("http://localhost:3001/api");
  });

  it("normalizes shorthand host url that starts with colon", () => {
    expect(resolveApiBaseUrl(":3001/api")).toBe("http://localhost:3001/api");
  });

  it("resolves relative api path from browser origin", () => {
    vi.stubGlobal("window", {
      location: {
        origin: "http://localhost:3000",
        protocol: "http:",
      },
    });

    expect(resolveApiBaseUrl("/api")).toBe("http://localhost:3000/api");

    vi.unstubAllGlobals();
  });
});
