import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("converts text to kebab-case", () => {
    expect(slugify("Smart Inbox Routing"))
      .toBe("smart-inbox-routing");
  });

  it("removes non-alphanumeric characters", () => {
    expect(slugify("Team@Scale: Growth+Ops"))
      .toBe("team-scale-growth-ops");
  });

  it("trims repeated separators", () => {
    expect(slugify("  Launch --- Plan  "))
      .toBe("launch-plan");
  });
});
