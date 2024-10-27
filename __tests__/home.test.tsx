import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home", () => {
  it("renders a heading", () => {
    render(<Home />);

    const banner = screen.getByText(/weeks/);

    expect(banner).toBeInTheDocument();
  });
});
