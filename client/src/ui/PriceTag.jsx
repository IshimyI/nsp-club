import { HStack, Text, VStack, Skeleton } from "@chakra-ui/react";
import useRate from "../useRate";

export default function PriceTag({ priceRetailUsd, priceDiscountUsd, size = "md" }) {
  const rub = useRate();

  if (!priceRetailUsd) {
    return (
      <Text color="textFaint" fontSize={size === "lg" ? "md" : "sm"}>
        Цена уточняется
      </Text>
    );
  }

  const fontSize = size === "lg" ? "2xl" : "lg";
  const usd = priceDiscountUsd ?? priceRetailUsd;

  if (!rub) {
    return <Skeleton height={size === "lg" ? "32px" : "24px"} width="110px" borderRadius="md" />;
  }

  const rubPrimary = Math.round(usd * rub);
  const rubRetail = priceDiscountUsd ? Math.round(priceRetailUsd * rub) : null;

  return (
    <VStack align="start" spacing={0}>
      <HStack spacing={2} align="baseline">
        <Text fontWeight="800" fontSize={fontSize} color="nsp.700" _dark={{ color: "nsp.300" }}>
          {rubPrimary.toLocaleString("ru-RU")} ₽
        </Text>
        {rubRetail ? (
          <Text as="s" color="textFaint" fontSize="sm">
            {rubRetail.toLocaleString("ru-RU")} ₽
          </Text>
        ) : null}
      </HStack>
      <Text fontSize="sm" color="textMuted">
        ≈ ${usd}{priceDiscountUsd ? ` · розница $${priceRetailUsd}` : ""}
      </Text>
      <Text fontSize="xs" color="textFaint">
        {priceDiscountUsd ? "цена по дисконтной карте · " : ""}
        по курсу ЦБ на сегодня, окончательно — при заказе
      </Text>
    </VStack>
  );
}
