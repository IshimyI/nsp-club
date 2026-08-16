import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Flex,
  HStack,
  Image,
  Skeleton,
  Icon,
} from "@chakra-ui/react";
import Check from "lucide-react/dist/esm/icons/check";
import { Link as RouterLink } from "react-router-dom";
import { fetchProducts } from "../api";
import ProductCard from "../ui/ProductCard";
import categoryIcon from "../categoryIcons";

const TRUST_ITEMS = [
  "На рынке с 1972 года",
  "GMP-сертифицированное производство",
  "Официальный дистрибьютор NSP",
];

export default function HomePage() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  const sections = useMemo(() => {
    if (!products) return [];
    const priced = products.filter((p) => p.priceRetailUsd);
    const byCategory = new Map();
    for (const p of priced) {
      const list = byCategory.get(p.category) || [];
      list.push(p);
      byCategory.set(p.category, list);
    }
    return [...byCategory.entries()].map(([category, items]) => ({
      category,
      items: items.slice(0, 4),
    }));
  }, [products]);

  const heroImages = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.images?.length).slice(0, 4);
  }, [products]);

  const stats = useMemo(() => {
    if (!products) return null;
    const categories = new Set(products.map((p) => p.category)).size;
    const years = new Date().getFullYear() - 2023;
    return [
      { value: `${products.length}+`, label: "товаров в каталоге" },
      { value: String(categories), label: "категории" },
      { value: years > 0 ? `${years}+` : "с 2023", label: "года на рынке" },
    ];
  }, [products]);

  return (
    <Box>
      <Flex
        bgGradient="linear(135deg, heroBg, cardBg)"
        borderRadius="xl"
        p={{ base: 6, md: 10 }}
        mb={10}
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        gap={8}
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: "absolute",
          top: "-30%",
          right: "-10%",
          w: "50%",
          h: "160%",
          bgGradient: "radial(nsp.200, transparent 70%)",
          opacity: 0.35,
          pointerEvents: "none",
          _dark: { bgGradient: "radial(nsp.700, transparent 70%)", opacity: 0.25 },
        }}
      >
        <Box maxW="600px">
          <Heading size="lg" mb={3} color="nsp.700" _dark={{ color: "nsp.300" }}>
            БАД и продукция Nature&apos;s Sunshine (NSP)
          </Heading>
          <Text color="textMuted" mb={5}>
            Полный каталог с подробными описаниями, составом и применением.
            Оформите заявку — мы свяжемся с вами, подтвердим наличие и цену в рублях.
          </Text>
          <Button as={RouterLink} to="/catalog" size="lg">
            Смотреть каталог
          </Button>
        </Box>

        <SimpleGrid
          columns={2}
          spacing={3}
          w={{ base: "100%", md: "260px" }}
          flexShrink={0}
          display={{ base: heroImages.length ? "grid" : "none", md: "grid" }}
        >
          {heroImages.map((p) => (
            <Box
              key={p.slug}
              bg="cardBg"
              borderRadius="lg"
              boxShadow="md"
              p={2}
              h="120px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Image src={`/images/${p.images[0]}`} alt={p.name} maxH="100px" objectFit="contain" />
            </Box>
          ))}
        </SimpleGrid>
      </Flex>

      <HStack
        spacing={{ base: 4, md: 8 }}
        justify="center"
        flexWrap="wrap"
        mb={10}
        color="textMuted"
        fontSize="sm"
        fontWeight="600"
      >
        {TRUST_ITEMS.map((item) => (
          <HStack key={item} spacing={2}>
            <Icon as={Check} boxSize={4} color="nsp.500" strokeWidth={2.5} />
            <Text>{item}</Text>
          </HStack>
        ))}
      </HStack>

      {stats ? (
        <SimpleGrid columns={3} spacing={4} mb={10} textAlign="center">
          {stats.map((s) => (
            <Box key={s.label} bg="cardBg" borderRadius="lg" py={4} borderWidth="1px" borderColor="borderColor">
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color="nsp.700" _dark={{ color: "nsp.300" }}>
                {s.value}
              </Text>
              <Text fontSize="xs" color="textFaint">{s.label}</Text>
            </Box>
          ))}
        </SimpleGrid>
      ) : null}

      {!products ? (
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={5}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} h="280px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      ) : (
        sections.map(({ category, items }) => (
          <Box key={category} mb={10}>
            <HStack justify="space-between" mb={5}>
              <HStack spacing={2}>
                <Icon as={categoryIcon(category)} boxSize={5} color="nsp.600" _dark={{ color: "nsp.300" }} strokeWidth={1.75} />
                <Heading size="md">{category}</Heading>
              </HStack>
              <Button
                as={RouterLink}
                to={`/catalog?category=${encodeURIComponent(category)}`}
                variant="link"
                colorScheme="nsp"
                size="sm"
              >
                Смотреть все →
              </Button>
            </HStack>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={5}>
              {items.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </SimpleGrid>
          </Box>
        ))
      )}
    </Box>
  );
}
