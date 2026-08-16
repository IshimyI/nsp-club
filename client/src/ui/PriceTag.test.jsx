import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import PriceTag from "./PriceTag";
import useRate from "../useRate";

vi.mock("../useRate");

function renderTag(props) {
  return render(
    <ChakraProvider>
      <PriceTag {...props} />
    </ChakraProvider>
  );
}

describe("PriceTag", () => {
  it("shows a placeholder when there is no price at all", () => {
    useRate.mockReturnValue(90);
    renderTag({ priceRetailUsd: null });
    expect(screen.getByText("Цена уточняется")).toBeInTheDocument();
  });

  it("shows a loading skeleton while the exchange rate hasn't loaded yet", () => {
    useRate.mockReturnValue(null);
    const { container } = renderTag({ priceRetailUsd: 10 });
    expect(container.querySelector(".chakra-skeleton")).not.toBeNull();
    expect(screen.queryByText("₽", { exact: false })).toBeNull();
  });

  it("shows rubles as the primary price once the rate is loaded", () => {
    useRate.mockReturnValue(90);
    renderTag({ priceRetailUsd: 10 });
    expect(screen.getByText("900 ₽")).toBeInTheDocument();
    expect(screen.getByText("≈ $10")).toBeInTheDocument();
  });

  it("shows a struck-through retail ruble price next to the discounted one", () => {
    useRate.mockReturnValue(90);
    renderTag({ priceRetailUsd: 10, priceDiscountUsd: 8 });
    expect(screen.getByText("720 ₽")).toBeInTheDocument(); // discounted: 8 * 90
    expect(screen.getByText("900 ₽")).toBeInTheDocument(); // struck-through retail: 10 * 90
    expect(screen.getByText("цена по дисконтной карте", { exact: false })).toBeInTheDocument();
  });
});
