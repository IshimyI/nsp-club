import { useEffect } from "react";

const SITE_ORIGIN = "https://nsp-club.ru";

export default function useProductJsonLd(product) {
  useEffect(() => {
    if (!product) return undefined;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      sku: product.article,
      image: product.images?.[0] ? `${SITE_ORIGIN}/images/${product.images[0]}` : undefined,
      description: product.highlights?.[0] || product.name,
      brand: { "@type": "Brand", name: "Nature's Sunshine Products" },
      offers: product.priceRetailUsd
        ? {
            "@type": "Offer",
            priceCurrency: "USD",
            price: product.priceDiscountUsd ?? product.priceRetailUsd,
            availability: "https://schema.org/InStock",
          }
        : undefined,
    });
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [product]);
}
