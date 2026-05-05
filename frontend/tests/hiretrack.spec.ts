import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

// ── 1. Login page loads correctly ──────────────────────────────────────────────
test("login page loads with HireTrack heading and paper plane", async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator("h1")).toContainText("HireTrack");
  await expect(page.locator("p")).toContainText("Track your job search, effortlessly.");
  await expect(page.locator("svg").first()).toBeVisible();
});

// ── 2. GitHub OAuth button is visible ─────────────────────────────────────────
test("GitHub OAuth button is visible and has correct href", async ({ page }) => {
  await page.goto(BASE_URL);
  const btn = page.locator("a", { hasText: "Continue with GitHub" });
  await expect(btn).toBeVisible();
  const href = await btn.getAttribute("href");
  expect(href).toContain("/api/auth/github");
});

// ── 3. Dashboard redirects unauthenticated users to login ─────────────────────
test("unauthenticated access to dashboard redirects to login", async ({ page }) => {
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForURL(`${BASE_URL}/`);
  await expect(page.locator("h1")).toContainText("HireTrack");
});

// ── Helper: inject a fake token so dashboard loads without real OAuth ──────────
async function loginWithFakeToken(page: import("@playwright/test").Page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.setItem("token", "fake-test-token"));
  await page.goto(`${BASE_URL}/dashboard`);
}

// ── 4. Dashboard loads with 4 tabs ────────────────────────────────────────────
test("dashboard shows 4 tabs after login", async ({ page }) => {
  await loginWithFakeToken(page);
  await expect(page.getByRole("button", { name: "Application Status Board" })).toBeVisible();
  await expect(page.getByRole("button", { name: "All Applications" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Deadlines Calendar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Analytics" })).toBeVisible();
});

// ── 5. All Applications tab shows table with correct columns ───────────────────
test("All Applications tab shows spreadsheet table with 12 column headers", async ({ page }) => {
  await loginWithFakeToken(page);
  await page.getByRole("button", { name: "All Applications" }).click();
  const expectedHeaders = [
    "Company Name",
    "Role / Position",
    "Location",
    "Application Date",
    "Application Status",
    "Application Link / Portal",
    "Contact Person",
    "Email / Phone",
    "Deadline",
    "Notes",
    "Resume URL",
    "Cover Letter URL",
  ];
  for (const header of expectedHeaders) {
    await expect(page.locator("th", { hasText: header }).first()).toBeVisible();
  }
});

// ── 6. "+ New" button opens AddJobModal ───────────────────────────────────────
test("clicking + New in All Applications tab opens AddJobModal", async ({ page }) => {
  await loginWithFakeToken(page);
  await page.getByRole("button", { name: "All Applications" }).click();
  await page.getByRole("button", { name: "+ New" }).first().click();
  await expect(page.locator("h2", { hasText: "Add Application" })).toBeVisible();
  await expect(page.locator("label", { hasText: "Company *" })).toBeVisible();
  await expect(page.locator("label", { hasText: "Resume URL" })).toBeVisible();
  await expect(page.locator("label", { hasText: "Cover Letter URL" })).toBeVisible();
});

// ── 7. Kanban board tab loads with all 6 columns ─────────────────────────────
test("Application Status Board tab shows all 6 Kanban columns", async ({ page }) => {
  await loginWithFakeToken(page);
  await page.getByRole("button", { name: "Application Status Board" }).click();
  for (const label of ["Applied", "Phone Screen", "Interview", "Offer", "Rejected", "Withdrawn"]) {
    await expect(page.locator("span", { hasText: label }).first()).toBeVisible();
  }
});

// ── 8. Calendar tab loads and shows current month ─────────────────────────────
test("Deadlines Calendar tab shows current month grid", async ({ page }) => {
  await loginWithFakeToken(page);
  await page.getByRole("button", { name: "Deadlines Calendar" }).click();
  const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  await expect(page.locator("span", { hasText: monthLabel })).toBeVisible();
  for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
    await expect(page.locator("div", { hasText: day }).first()).toBeVisible();
  }
});

// ── 9. Analytics tab loads without errors ─────────────────────────────────────
test("Analytics tab loads without crashing", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await loginWithFakeToken(page);
  await page.getByRole("button", { name: "Analytics" }).click();
  await page.waitForTimeout(500);
  expect(errors.filter((e) => !e.includes("401") && !e.includes("Failed to fetch"))).toHaveLength(0);
});
