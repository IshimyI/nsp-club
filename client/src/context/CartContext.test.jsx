import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";

const PRODUCT_A = { slug: "a", name: "Товар А", article: "111", priceRetailUsd: 10, priceDiscountUsd: 8, images: ["a.jpg"] };
const PRODUCT_B = { slug: "b", name: "Товар Б", article: "222", priceRetailUsd: 20, images: [] };

function TestHarness() {
  const { items, addItem, setQty, removeItem, clear, totalCount, totalUsd } = useCart();
  return (
    <div>
      <div data-testid="count">{totalCount}</div>
      <div data-testid="total">{totalUsd}</div>
      <div data-testid="items">{items.map((i) => `${i.slug}:${i.qty}`).join(",")}</div>
      <button onClick={() => addItem(PRODUCT_A, 1)}>add-a</button>
      <button onClick={() => addItem(PRODUCT_B, 2)}>add-b</button>
      <button onClick={() => setQty("a", 5)}>set-a-5</button>
      <button onClick={() => setQty("a", 0)}>remove-a-via-zero</button>
      <button onClick={() => removeItem("b")}>remove-b</button>
      <button onClick={clear}>clear</button>
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <TestHarness />
    </CartProvider>
  );
}

describe("CartContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty", () => {
    renderCart();
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByTestId("items").textContent).toBe("");
  });

  it("adds a new item", () => {
    renderCart();
    fireEvent.click(screen.getByText("add-a"));
    expect(screen.getByTestId("items").textContent).toBe("a:1");
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("increments quantity when adding the same item twice", () => {
    renderCart();
    fireEvent.click(screen.getByText("add-a"));
    fireEvent.click(screen.getByText("add-a"));
    expect(screen.getByTestId("items").textContent).toBe("a:2");
  });

  it("computes totalUsd from retail price × qty", () => {
    renderCart();
    fireEvent.click(screen.getByText("add-a")); // 10 * 1
    fireEvent.click(screen.getByText("add-b")); // 20 * 2
    expect(screen.getByTestId("total").textContent).toBe("50");
  });

  it("updates quantity via setQty", () => {
    renderCart();
    fireEvent.click(screen.getByText("add-a"));
    fireEvent.click(screen.getByText("set-a-5"));
    expect(screen.getByTestId("items").textContent).toBe("a:5");
  });

  it("removes an item when qty is set to 0", () => {
    renderCart();
    fireEvent.click(screen.getByText("add-a"));
    fireEvent.click(screen.getByText("remove-a-via-zero"));
    expect(screen.getByTestId("items").textContent).toBe("");
  });

  it("removes an item explicitly", () => {
    renderCart();
    fireEvent.click(screen.getByText("add-a"));
    fireEvent.click(screen.getByText("add-b"));
    fireEvent.click(screen.getByText("remove-b"));
    expect(screen.getByTestId("items").textContent).toBe("a:1");
  });

  it("clears the cart", () => {
    renderCart();
    fireEvent.click(screen.getByText("add-a"));
    fireEvent.click(screen.getByText("add-b"));
    fireEvent.click(screen.getByText("clear"));
    expect(screen.getByTestId("items").textContent).toBe("");
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("persists to localStorage", () => {
    renderCart();
    fireEvent.click(screen.getByText("add-a"));
    const stored = JSON.parse(localStorage.getItem("nsp-club-cart"));
    expect(stored).toHaveLength(1);
    expect(stored[0].slug).toBe("a");
  });
});
