// Behavior contract for the Beacon helpdesk fixture. A redesign must keep all of these passing.
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
  it("shows every primary destination", () => {
    renderAt("/");
    const nav = screen.getByRole("navigation");
    for (const name of ["Overview", "Tickets", "Customers", "Reports", "Settings"]) {
      expect(within(nav).getByRole("link", { name })).toBeInTheDocument();
    }
  });
  it("renders not-found for unknown routes", () => {
    renderAt("/nope");
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});

describe("overview", () => {
  it("computes counts from data", () => {
    renderAt("/");
    expect(screen.getByRole("group", { name: "Open tickets" })).toHaveTextContent("5");
    expect(screen.getByRole("group", { name: "Pending" })).toHaveTextContent("3");
    expect(screen.getByRole("group", { name: "Solved" })).toHaveTextContent("4");
    expect(screen.getByRole("group", { name: "CSAT" })).toHaveTextContent("94%");
  });
});

describe("tickets", () => {
  it("lists tickets and searches by subject", async () => {
    const user = userEvent.setup();
    renderAt("/tickets");
    expect(await screen.findByRole("link", { name: "Cannot export invoices to CSV" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search tickets"), "webhook");
    expect(screen.getByRole("link", { name: "Webhook deliveries failing" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cannot export invoices to CSV" })).not.toBeInTheDocument();
  });

  it("filters by status and priority, shows an empty state, and clears", async () => {
    const user = userEvent.setup();
    renderAt("/tickets");
    await screen.findByRole("link", { name: "Cannot export invoices to CSV" });
    await user.selectOptions(screen.getByLabelText("Status"), "solved");
    expect(screen.getByRole("link", { name: "Change billing email" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cannot export invoices to CSV" })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Priority"), "urgent");
    expect(screen.getByText("No tickets found.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("link", { name: "Cannot export invoices to CSV" })).toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    renderAt("/tickets?simulate=error");
    expect(await screen.findByText(/could not reach the ticket service/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows the loading state", () => {
    renderAt("/tickets?simulate=loading");
    expect(screen.getByText(/Loading tickets/)).toBeInTheDocument();
  });
});

describe("ticket detail", () => {
  it("appends a reply to the conversation", async () => {
    const user = userEvent.setup();
    renderAt("/tickets/T-1042");
    expect(screen.getByRole("heading", { name: "Cannot export invoices to CSV" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Reply"), "Fix is rolling out now.");
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    expect(screen.getByText("Fix is rolling out now.")).toBeInTheDocument();
    expect(screen.getByLabelText("Reply")).toHaveValue("");
  });

  it("changes status", async () => {
    const user = userEvent.setup();
    renderAt("/tickets/T-1042");
    await user.selectOptions(screen.getByLabelText("Status"), "solved");
    expect(screen.getByLabelText("Status")).toHaveValue("solved");
  });

  it("handles unknown tickets", () => {
    renderAt("/tickets/T-0000");
    expect(screen.getByRole("heading", { name: "Ticket not found" })).toBeInTheDocument();
  });
});

describe("customers and reports", () => {
  it("searches customers", async () => {
    const user = userEvent.setup();
    renderAt("/customers");
    expect(screen.getByText("Northwind Foods")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search customers"), "lumen");
    expect(screen.getByText("Lumen Labs")).toBeInTheDocument();
    expect(screen.queryByText("Northwind Foods")).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText("Search customers"));
    await user.type(screen.getByLabelText("Search customers"), "zzz");
    expect(screen.getByText("No customers found.")).toBeInTheDocument();
  });

  it("reports ticket counts", () => {
    renderAt("/reports");
    expect(screen.getByText("A snapshot of all 12 tickets.")).toBeInTheDocument();
    expect(screen.getByText("Tickets by status")).toBeInTheDocument();
    expect(screen.getByText("Busiest customers")).toBeInTheDocument();
  });
});

describe("settings and login", () => {
  it("validates email, then saves", async () => {
    const user = userEvent.setup();
    renderAt("/settings");
    const email = screen.getByLabelText("Email");
    await user.clear(email);
    await user.type(email, "not-an-email");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "true");
    await user.clear(email);
    await user.type(email, "maya@studio.test");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("requires credentials, then signs in", async () => {
    const user = userEvent.setup();
    const router = renderAt("/login");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter your email and password.");
    await user.type(screen.getByLabelText("Email"), "maya@beacon.test");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(router.state.location.pathname).toBe("/");
  });
});
