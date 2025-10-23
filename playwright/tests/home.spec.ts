import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("displays hero content and trending automations", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Discover, share, and level up your Poke automations.",
      })
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: "Trending this week" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Smart Inbox Routing" }).first()).toBeVisible();
    await expect(page.getByText("not affiliated with poke", { exact: false })).toBeVisible();
  });
});
