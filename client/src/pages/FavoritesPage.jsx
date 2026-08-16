import { useEffect, useState } from "react";
import { Box, Heading, Text, SimpleGrid, Center, Button } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { fetchProducts } from "../api";
import { useFavorites } from "../context/FavoritesContext";
import ProductCard from "../ui/ProductCard";
import useDocumentMeta from "../useDocumentMeta";

export default function FavoritesPage() {
  useDocumentMeta("Избранное — NSP Club", "Сохранённые товары NSP.");
  const { slugs } = useFavorites();
  const [products, setProducts] = useState(null);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  if (slugs.length === 0) {
    return (
      <Center py={20} flexDirection="column" gap={4} textAlign="center">
        <Heading size="lg">Избранное пусто</Heading>
        <Text color="textMuted">Отмечайте товары значком сердца в каталоге, чтобы сохранить их сюда.</Text>
        <Button as={RouterLink} to="/catalog">В каталог</Button>
      </Center>
    );
  }

  if (!products) return null;
  const items = products.filter((p) => slugs.includes(p.slug));

  return (
    <Box>
      <Heading size="lg" mb={6}>Избранное</Heading>
      <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={5}>
        {items.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
