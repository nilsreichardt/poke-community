import { test, expect } from "@playwright/test";

test.describe("Automations listing", () => {
  test("supports search and sort", async ({ page }) => {
    await page.goto("/automations");

    await expect(
      page.getByRole("heading", { name: "Community automations" }),
    ).toBeVisible();

    await page
      .getByPlaceholder("Search by title, summary, or tags")
      .fill("onboarding");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(
      page.getByRole("link", { name: "Onboarding Pulse Template" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Sort by votes" }).click();
    await expect(page).toHaveURL(/sort=top/);
    await expect(
      page.getByRole("link", { name: "Sort by newest" }),
    ).toBeVisible();
  });
});
