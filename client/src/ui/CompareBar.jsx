import { Box, HStack, Text, Button, Image } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCompare } from "../context/CompareContext";
import { fetchProducts } from "../api";

export default function CompareBar() {
  const { slugs, clearCompare } = useCompare();
  const [products, setProducts] = useState(null);

  useEffect(() => {
    if (slugs.length > 0 && !products) fetchProducts().then(setProducts);
  }, [slugs, products]);

  if (slugs.length < 2) return null;
  const items = (products || []).filter((p) => slugs.includes(p.slug));

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      bg="nsp.900"
      color="white"
      py={3}
      px={4}
      zIndex="95"
      boxShadow="0 -2px 10px rgba(0,0,0,0.2)"
    >
      <HStack maxW="1200px" mx="auto" justify="space-between" flexWrap="wrap" gap={3}>
        <HStack spacing={2}>
          {items.map((p) => (
            <Box key={p.slug} boxSize="36px" bg="white" borderRadius="md" overflow="hidden">
              {p.images?.[0] ? (
                <Image src={`/images/${p.images[0]}`} alt="" boxSize="36px" objectFit="contain" />
              ) : null}
            </Box>
          ))}
          <Text fontSize="sm">Выбрано для сравнения: {slugs.length}</Text>
        </HStack>
        <HStack spacing={3}>
          <Button size="sm" variant="ghost" color="whiteAlpha.800" onClick={clearCompare}>
            Очистить
          </Button>
          <Button as={RouterLink} to="/compare" size="sm">
            Сравнить
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
}
