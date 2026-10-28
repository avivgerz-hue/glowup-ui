// Behavior contract for the demo app. A redesign must keep all of these passing.
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../src/routes.jsx";

function renderAt(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe("navigation", () => {
  it("shows every primary nav destination", () => {
    renderAt("/");
    const nav = screen.getByRole("navigation");
    for (const name of ["Dashboard", "Projects", "Team", "Settings"]) {
      expect(within(nav).getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("renders the not-found page for unknown routes", () => {
    renderAt("/nope");
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});

describe("dashboard", () => {
  it("computes the summary numbers from data", () => {
    renderAt("/");
    expect(screen.getByRole("group", { name: "Active projects" })).toHaveTextContent("2");
    expect(screen.getByRole("group", { name: "At risk" })).toHaveTextContent("1");
    expect(screen.getByRole("group", { name: "Open tasks" })).toHaveTextContent("7");
    expect(screen.getByRole("group", { name: "Pipeline" })).toHaveTextContent("$276,000");
  });
});

describe("projects", () => {
  it("lists projects and filters by search", async () => {
    const user = userEvent.setup();
    renderAt("/projects");
    expect(await screen.findByRole("link", { name: "Harbor rebrand" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search projects"), "atlas");
    expect(screen.getByRole("link", { name: "Atlas mobile app" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Harbor rebrand" })).not.toBeInTheDocument();
  });

  it("filters by status and shows an empty state that can be cleared", async () => {
    const user = userEvent.setup();
    renderAt("/projects");
    await screen.findByRole("link", { name: "Harbor rebrand" });
    await user.selectOptions(screen.getByLabelText("Status"), "paused");
    expect(screen.getByRole("link", { name: "Fern & Co. storefront" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search projects"), "zzz");
    expect(screen.getByText("No projects found.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("link", { name: "Harbor rebrand" })).toBeInTheDocument();
  });

  it("shows loading, error with retry, and empty states", async () => {
    renderAt("/projects?simulate=error");
    expect(await screen.findByText(/server took too long/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows the loading state", () => {
    renderAt("/projects?simulate=loading");
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });
});

describe("project detail", () => {
  it("toggles a task and updates the count", async () => {
    const user = userEvent.setup();
    renderAt("/projects/p1");
    expect(screen.getByRole("heading", { name: /Tasks \(2\/4 done\)/ })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Packaging mockups" }));
    expect(screen.getByRole("heading", { name: /Tasks \(3\/4 done\)/ })).toBeInTheDocument();
  });

  it("handles unknown projects", () => {
    renderAt("/projects/missing");
    expect(screen.getByRole("heading", { name: "Project not found" })).toBeInTheDocument();
  });
});

describe("team", () => {
  it("invites a member through the dialog", async () => {
    const user = userEvent.setup();
    renderAt("/team");
    await user.click(screen.getByRole("button", { name: "Invite member" }));
    const dialog = screen.getByRole("dialog", { name: "Invite a teammate" });
    await user.type(within(dialog).getByLabelText("Email"), "new@plotline.test");
    await user.click(within(dialog).getByRole("button", { name: "Send invite" }));
    expect(screen.getByRole("status")).toHaveTextContent("new@plotline.test");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("settings", () => {
  it("validates the email and saves valid input", async () => {
    const user = userEvent.setup();
    renderAt("/settings");
    const email = screen.getByLabelText("Email");
    await user.clear(email);
    await user.type(email, "not-an-email");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "true");

    await user.clear(email);
    await user.type(email, "ana@studio.test");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
});

describe("login", () => {
  it("requires credentials, then navigates to the dashboard", async () => {
    const user = userEvent.setup();
    const router = renderAt("/login");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter your email and password.");
    await user.type(screen.getByLabelText("Email"), "ana@plotline.test");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(router.state.location.pathname).toBe("/");
  });
});
