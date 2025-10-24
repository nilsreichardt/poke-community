import { createAutomationAction, toggleVoteAction } from "@/app/actions/automation-actions";
import { automationFormInitialState } from "@/app/actions/form-states";
import { getAutomationBySlug, getAutomations } from "@/lib/data/automations";
import { resetMockState, setMockCurrentUser } from "@/lib/data/mock-data";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/email/subscriptions", () => ({
  sendAutomationAnnouncement: jest.fn(),
}));

describe("server actions in mock mode", () => {
  beforeEach(() => {
    resetMockState();
    setMockCurrentUser("11111111-1111-1111-1111-111111111111");
  });

  it("creates a new automation entry", async () => {
    const formData = new FormData();
    formData.set("title", "Campaign Orchestrator");
    formData.set("summary", "Coordinates launches across channels.");
    formData.set("description", "Full walkthrough of our launch playbook.");
    formData.set("prompt", "Draft the launch announcement for {{audience}} and schedule social posts across LinkedIn, X, and email.");
    formData.set("tags", "marketing, orchestration");

    const result = await createAutomationAction(automationFormInitialState, formData);
    expect(result.status).toBe("success");
    expect(result.slug).toBeDefined();

    const matches = await getAutomations({ search: "Campaign Orchestrator" });
    expect(matches.some((item) => item.slug === result.slug)).toBe(true);
  });

  it("toggles vote value", async () => {
    const slug = "smart-inbox-routing";
    const before = await getAutomationBySlug(slug);
    expect(before?.vote_total).toBeGreaterThanOrEqual(0);

    await toggleVoteAction(before!.id, -1);
    const after = await getAutomationBySlug(slug);
    expect(after?.vote_total).toBe(before!.vote_total - 2);

    await toggleVoteAction(before!.id, -1);
    const reset = await getAutomationBySlug(slug);
    expect(reset?.vote_total).toBe(before!.vote_total - 1);

    await toggleVoteAction(before!.id, 1);
    const restored = await getAutomationBySlug(slug);
    expect(restored?.vote_total).toBe(before!.vote_total);
  });
});
