import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Image,
  Center,
  Button,
  Divider,
  Icon,
} from "@chakra-ui/react";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import { Link as RouterLink } from "react-router-dom";
import { fetchProducts } from "../api";
import { useCompare } from "../context/CompareContext";
import PriceTag from "../ui/PriceTag";
import useDocumentMeta from "../useDocumentMeta";

const SECTION_ORDER = ["Активные ингредиенты", "Состав", "Применение"];

export default function ComparePage() {
  useDocumentMeta("Сравнение товаров — NSP Club", "Сравнение БАД NSP по цене и составу.");
  const { slugs, clearCompare } = useCompare();
  const [products, setProducts] = useState(null);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  if (slugs.length === 0) {
    return (
      <Center py={20} flexDirection="column" gap={4} textAlign="center">
        <Heading size="lg">Список сравнения пуст</Heading>
        <Text color="textMuted">Отметьте товары галочкой «Сравнить» в каталоге.</Text>
        <Button as={RouterLink} to="/catalog">В каталог</Button>
      </Center>
    );
  }

  if (!products) return null;
  const items = products.filter((p) => slugs.includes(p.slug));

  return (
    <Box>
      <Heading size="lg" mb={6}>Сравнение товаров</Heading>
      <SimpleGrid columns={{ base: 1, md: items.length }} spacing={5} mb={8}>
        {items.map((p) => (
          <VStack key={p.slug} align="stretch" spacing={3} bg="cardBg" borderWidth="1px" borderColor="borderColor" borderRadius="lg" p={4}>
            <Center bg="subtleBg" borderRadius="md" h="140px">
              {p.images?.[0] ? (
                <Image src={`/images/${p.images[0]}`} alt={p.name} maxH="130px" objectFit="contain" />
              ) : (
                <Icon as={Leaf} boxSize={6} color="textFaint" strokeWidth={1.5} />
              )}
            </Center>
            <Text fontWeight="700">{p.name}</Text>
            <Text fontSize="xs" color="textFaint">Арт. {p.article}</Text>
            <PriceTag priceRetailUsd={p.priceRetailUsd} priceDiscountUsd={p.priceDiscountUsd} />
            <Button as={RouterLink} to={`/product/${p.slug}`} size="sm" variant="outline">
              Подробнее
            </Button>
            <Divider />
            {SECTION_ORDER.filter((h) => p.sections[h]).map((header) => (
              <Box key={header}>
                <Text fontWeight="600" fontSize="sm" color="nsp.700" _dark={{ color: "nsp.300" }} mb={1}>
                  {header}
                </Text>
                <Text fontSize="sm" color="textMuted" noOfLines={6}>
                  {p.sections[header]}
                </Text>
              </Box>
            ))}
          </VStack>
        ))}
      </SimpleGrid>
      <Button variant="outline" onClick={clearCompare}>Очистить сравнение</Button>
    </Box>
  );
}
