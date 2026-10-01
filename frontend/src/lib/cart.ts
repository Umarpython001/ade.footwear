import type { CartItem } from "../context/Cart";
import type { Product } from "../types/product";

export type LineIssue = "missing" | "soldOut" | "sizeSoldOut";

export interface CartLine {
    item: CartItem;
    product: Product | null;
    issue: LineIssue | null;
    lineTotalKobo: number;
}

// Joins cart lines with current product data. Prices always come from the
// product, never from the cart.
export function resolveCartLines(items: CartItem[], products: Product[]) {
    const lines: CartLine[] = items.map((item) => {
        const product = products.find((p) => p.id === item.productId) ?? null;
        let issue: LineIssue | null = null;
        if (!product) {
            issue = "missing";
        } else if (!product.available) {
            issue = "soldOut";
        } else if (!product.sizes.some((s) => s.size === item.size && s.available)) {
            issue = "sizeSoldOut";
        }
        const lineTotalKobo = product && !issue ? product.priceKobo * item.quantity : 0;
        return { item, product, issue, lineTotalKobo };
    });

    const subtotalKobo = lines.reduce((sum, line) => sum + line.lineTotalKobo, 0);
    const hasIssues = lines.some((line) => line.issue !== null);
    return { lines, subtotalKobo, hasIssues };
}

export function issueMessage(issue: LineIssue, size: string): string {
    switch (issue) {
        case "missing":
            return "This product is no longer in the catalogue. Remove it to continue.";
        case "soldOut":
            return "This product is sold out. Remove it to continue.";
        case "sizeSoldOut":
            return `Size ${size} is sold out. Remove it, then add another size from the product page.`;
    }
}
