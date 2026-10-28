import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../src/routes.jsx";

test("the home page renders a single h1", () => {
  render(<MemoryRouter><AppRoutes /></MemoryRouter>);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});
