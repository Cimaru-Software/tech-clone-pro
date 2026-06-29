declare function gtag(...args: unknown[]): void;

type GaItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  price: number;
  quantity: number;
};

export function gaAddToCart(item: GaItem) {
  if (typeof gtag === "undefined") return;
  gtag("event", "add_to_cart", {
    currency: "USD",
    value: item.price * item.quantity,
    items: [item],
  });
}

export function gaBeginCheckout(items: GaItem[], value: number) {
  if (typeof gtag === "undefined") return;
  gtag("event", "begin_checkout", {
    currency: "USD",
    value,
    items,
  });
}

export function gaPurchase(transactionId: string, items: GaItem[], value: number) {
  if (typeof gtag === "undefined") return;
  gtag("event", "purchase", {
    transaction_id: transactionId,
    currency: "USD",
    value,
    items,
  });
}
