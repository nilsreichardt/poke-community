import { getAutomations, getTrendingAutomations } from "@/lib/data/automations";
import {
  resetMockState,
  setMockCurrentUser,
} from "@/lib/data/mock-data";

describe("mock automation data queries", () => {
  beforeEach(() => {
    resetMockState();
    setMockCurrentUser("11111111-1111-1111-1111-111111111111");
  });

  it("filters automations by search term", async () => {
    const results = await getAutomations({ search: "routing" });
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("smart-inbox-routing");
  });

  it("sorts automations by top votes", async () => {
    const results = await getAutomations({ orderBy: "top" });
    expect(results[0].slug).toBe("smart-inbox-routing");
    expect(results[1].slug).toBe("onboarding-pulse-template");
  });

  it("limits trending automations", async () => {
    const results = await getTrendingAutomations(1);
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("smart-inbox-routing");
  });
});
