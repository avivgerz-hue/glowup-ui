// Behavior contract for the Saltwater Spa booking fixture. A redesign must keep all of these passing.
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../src/routes.jsx";
import { clearBooking } from "../src/booking.js";

function renderAt(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}
beforeEach(() => clearBooking());

describe("navigation and content", () => {
  it("shows the main navigation and a booking call to action", () => {
    renderAt("/");
    const nav = screen.getByRole("navigation");
    for (const name of ["Home", "Services", "About", "Contact"]) expect(within(nav).getByRole("link", { name })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /book/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Rest by the sea");
  });
  it("renders not-found for unknown routes", () => {
    renderAt("/nope");
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
  it("shows opening hours on the about page", () => {
    renderAt("/about");
    expect(screen.getByText(/Monday to Friday: 9am to 6pm/)).toBeInTheDocument();
  });
});

describe("services", () => {
  it("filters by category and search", async () => {
    const user = userEvent.setup();
    renderAt("/services");
    expect(screen.getByRole("link", { name: "Deep Tissue Massage" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Category"), "Facials");
    expect(screen.getByRole("link", { name: "Radiance Facial" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Deep Tissue Massage" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Search services"), "zzz");
    expect(screen.getByText("No services match your search.")).toBeInTheDocument();
  });
  it("shows a service detail with a booking link", () => {
    renderAt("/services/hot-stone");
    expect(screen.getByRole("heading", { name: "Hot Stone Massage" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book this treatment" })).toHaveAttribute("href", "/book?service=hot-stone");
  });
  it("handles an unknown service", () => {
    renderAt("/services/nope");
    expect(screen.getByRole("heading", { name: "Service not found" })).toBeInTheDocument();
  });
});

describe("booking flow", () => {
  it("requires a service before continuing", async () => {
    const user = userEvent.setup();
    renderAt("/book");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please choose a service.");
  });

  it("completes a booking and shows the confirmation", async () => {
    const user = userEvent.setup();
    const router = renderAt("/book?service=swedish");
    expect(screen.getByRole("radio", { name: /Swedish Massage/ })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please choose a date and a time.");
    await user.type(screen.getByLabelText("Date"), "2026-11-12");
    await user.click(screen.getByRole("radio", { name: "10:30 AM" }));
    expect(screen.getByLabelText("Booking summary")).toHaveTextContent("2026-11-12 at 10:30 AM");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Confirm booking" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter your name.");
    await user.type(screen.getByLabelText("Name"), "Alex Morgan");
    await user.type(screen.getByLabelText("Email"), "bad");
    await user.click(screen.getByRole("button", { name: "Confirm booking" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid email address.");
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "alex@example.test");
    await user.click(screen.getByRole("button", { name: "Confirm booking" }));
    expect(router.state.location.pathname).toBe("/confirmation");
    expect(await screen.findByRole("heading", { name: "Booking confirmed" })).toBeInTheDocument();
    expect(screen.getByText(/SW-\d+/)).toBeInTheDocument();
    expect(screen.getByText("Swedish Massage")).toBeInTheDocument();
  });

  it("disables unavailable times and lets you go back", async () => {
    const user = userEvent.setup();
    renderAt("/book?service=swedish");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByLabelText("Date"), "2026-11-12");
    expect(screen.getByRole("radio", { name: /9:00 AM/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "10:30 AM" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: /Swedish Massage/ })).toBeChecked();
  });

  it("explains when there is no booking to confirm", () => {
    renderAt("/confirmation");
    expect(screen.getByRole("heading", { name: "No booking yet" })).toBeInTheDocument();
  });
});

describe("contact", () => {
  it("validates, then confirms the message was sent", async () => {
    const user = userEvent.setup();
    renderAt("/contact");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please fill in your name and message.");
    await user.type(screen.getByLabelText("Name"), "Sam");
    await user.type(screen.getByLabelText("Email"), "sam@example.test");
    await user.type(screen.getByLabelText("Message"), "Do you offer gift cards?");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByRole("status")).toHaveTextContent("Thanks, Sam");
  });
});
