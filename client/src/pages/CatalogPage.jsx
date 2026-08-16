import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Skeleton,
  Text,
  Wrap,
  WrapItem,
  Tag,
  TagCloseButton,
  Select,
  Flex,
  HStack,
  Image,
  Button,
  Center,
  Icon,
} from "@chakra-ui/react";
import Search from "lucide-react/dist/esm/icons/search";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { fetchProducts } from "../api";
import ProductCard from "../ui/ProductCard";
import QuickViewModal from "../ui/QuickViewModal";
import useDocumentMeta from "../useDocumentMeta";
import categoryIcon from "../categoryIcons";
import { useRecentlyViewed } from "../context/RecentlyViewedContext";

const SORT_OPTIONS = [
  { value: "", label: "По умолчанию" },
  { value: "name", label: "По названию (А-Я)" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
  { value: "discount", label: "Сначала со скидкой" },
];

const PAGE_SIZE = 24;

export default function CatalogPage() {
  const [products, setProducts] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchParams, setSearchParams] = useSearchParams();
  const { slugs: recentSlugs } = useRecentlyViewed();
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const tagsParam = searchParams.get("tags") || "";
  const tags = tagsParam.split(",").filter(Boolean);
  const sort = searchParams.get("sort") || "";
  const minPrice = searchParams.get("min") || "";
  const maxPrice = searchParams.get("max") || "";

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, category, tagsParam, sort, minPrice, maxPrice]);

  useDocumentMeta(
    category ? `${category} — каталог NSP Club` : "Каталог — NSP Club",
    "Каталог БАД, витаминов и продукции Nature's Sunshine (NSP) с фильтрами по категориям и назначению."
  );

  const categories = useMemo(() => {
    if (!products) return [];
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return [...set].sort();
  }, [products]);

  const availableTags = useMemo(() => {
    if (!products) return [];
    if (category && category !== "БАД") return [];
    const set = new Set();
    for (const p of products) {
      if (p.category === "БАД") p.tags?.forEach((t) => set.add(t));
    }
    return [...set].sort();
  }, [products, category]);

  const recentProducts = useMemo(() => {
    if (!products) return [];
    return recentSlugs.map((s) => products.find((p) => p.slug === s)).filter(Boolean);
  }, [products, recentSlugs]);

  const setParam = (key, value) => {
    const next = Object.fromEntries(searchParams);
    if (value) next[key] = value;
    else delete next[key];
    if (key === "category" && next.tags) delete next.tags;
    setSearchParams(next);
  };

  const toggleTag = (t) => {
    const set = new Set(tags);
    if (set.has(t)) set.delete(t);
    else set.add(t);
    setParam("tags", [...set].join(","));
  };

  const clearAllFilters = () => setSearchParams({});

  const activeFilters = useMemo(() => {
    const list = [];
    if (category) list.push({ key: "category", label: `${categoryIcon(category)} ${category}`, clear: () => setParam("category", "") });
    for (const t of tags) list.push({ key: `tag-${t}`, label: t, clear: () => toggleTag(t) });
    if (minPrice) list.push({ key: "min", label: `от $${minPrice}`, clear: () => setParam("min", "") });
    if (maxPrice) list.push({ key: "max", label: `до $${maxPrice}`, clear: () => setParam("max", "") });
    if (q.trim()) list.push({ key: "q", label: `«${q.trim()}»`, clear: () => setParam("q", "") });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, tags, minPrice, maxPrice, q]);

  const filtered = useMemo(() => {
    if (!products) return null;
    let list = products;
    if (category) list = list.filter((p) => p.category === category);
    if (tags.length) list = list.filter((p) => p.tags?.some((t) => tags.includes(t)));
    if (minPrice) list = list.filter((p) => (p.priceRetailUsd ?? 0) >= Number(minPrice));
    if (maxPrice) list = list.filter((p) => (p.priceRetailUsd ?? Infinity) <= Number(maxPrice));
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.nameEn?.toLowerCase().includes(needle) ||
          p.article?.toLowerCase().includes(needle) ||
          p.highlights?.some((h) => h.toLowerCase().includes(needle)) ||
          Object.values(p.sections || {}).some((s) => s.toLowerCase().includes(needle))
      );
    }
    list = [...list];
    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    } else if (sort === "price-asc") {
      list.sort((a, b) => (a.priceRetailUsd ?? Infinity) - (b.priceRetailUsd ?? Infinity));
    } else if (sort === "price-desc") {
      list.sort((a, b) => (b.priceRetailUsd ?? -1) - (a.priceRetailUsd ?? -1));
    } else if (sort === "discount") {
      const discountPct = (p) =>
        p.priceRetailUsd && p.priceDiscountUsd
          ? (p.priceRetailUsd - p.priceDiscountUsd) / p.priceRetailUsd
          : -1;
      list.sort((a, b) => discountPct(b) - discountPct(a));
    }
    return list;
  }, [products, q, category, tags, sort, minPrice, maxPrice]);

  return (
    <Box>
      <Heading size="lg" mb={5}>Каталог</Heading>

      {recentProducts.length > 0 ? (
        <Box mb={8}>
          <Text fontWeight="600" mb={3} color="textMuted" fontSize="sm">Недавно просмотренные</Text>
          <HStack spacing={3} overflowX="auto" pb={2}>
            {recentProducts.map((p) => (
              <RouterLink key={p.slug} to={`/product/${p.slug}`}>
                <Box
                  bg="cardBg"
                  borderWidth="1px"
                  borderColor="borderColor"
                  borderRadius="md"
                  p={2}
                  w="80px"
                  h="80px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {p.images?.[0] ? (
                    <Image src={`/images/${p.images[0]}`} alt={p.name} maxH="70px" objectFit="contain" />
                  ) : (
                    <Icon as={Leaf} boxSize={5} color="textFaint" strokeWidth={1.5} />
                  )}
                </Box>
              </RouterLink>
            ))}
          </HStack>
        </Box>
      ) : null}

      <Flex gap={4} mb={4} flexWrap="wrap" align="center">
        <InputGroup maxW="420px" flex="1" minW="220px">
          <InputLeftElement pointerEvents="none">
            <Icon as={Search} boxSize={4} color="textFaint" strokeWidth={2} />
          </InputLeftElement>
          <Input
            value={q}
            onChange={(e) => setParam("q", e.target.value)}
            placeholder="Поиск по названию, назначению или составу..."
            bg="cardBg"
          />
        </InputGroup>
        <Select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          bg="cardBg"
          maxW="220px"
          size="md"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <HStack spacing={2}>
          <Input
            type="number"
            placeholder="от $"
            value={minPrice}
            onChange={(e) => setParam("min", e.target.value)}
            bg="cardBg"
            w="90px"
            size="md"
          />
          <Text color="textFaint">—</Text>
          <Input
            type="number"
            placeholder="до $"
            value={maxPrice}
            onChange={(e) => setParam("max", e.target.value)}
            bg="cardBg"
            w="90px"
            size="md"
          />
        </HStack>
      </Flex>

      <Box position="sticky" top="60px" zIndex="80" bg="pageBg" pt={2} pb={1}>
        {categories.length > 0 ? (
          <Wrap mb={availableTags.length ? 3 : 3} spacing={2}>
            <WrapItem>
              <Tag
                as="button"
                onClick={() => setParam("category", "")}
                colorScheme={category ? "gray" : "nsp"}
                variant={category ? "subtle" : "solid"}
                cursor="pointer"
              >
                Все
              </Tag>
            </WrapItem>
            {categories.map((c) => (
              <WrapItem key={c}>
                <Tag
                  as="button"
                  onClick={() => setParam("category", c)}
                  colorScheme={category === c ? "nsp" : "gray"}
                  variant={category === c ? "solid" : "subtle"}
                  cursor="pointer"
                >
                  <Icon as={categoryIcon(c)} boxSize={3.5} mr={1.5} strokeWidth={1.75} />
                  {c}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        ) : null}

        {availableTags.length > 0 ? (
          <Wrap spacing={2}>
            {availableTags.map((t) => (
              <WrapItem key={t}>
                <Tag
                  as="button"
                  onClick={() => toggleTag(t)}
                  size="sm"
                  colorScheme={tags.includes(t) ? "nsp" : "gray"}
                  variant={tags.includes(t) ? "solid" : "outline"}
                  cursor="pointer"
                >
                  {t}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        ) : null}
      </Box>

      {activeFilters?.length ? (
        <Wrap mb={5} mt={3} spacing={2} align="center">
          <WrapItem>
            <Text fontSize="sm" color="textFaint">Фильтры:</Text>
          </WrapItem>
          {activeFilters.map((f) => (
            <WrapItem key={f.key}>
              <Tag colorScheme="nsp" variant="subtle">
                {f.label}
                <TagCloseButton onClick={f.clear} />
              </Tag>
            </WrapItem>
          ))}
          <WrapItem>
            <Button size="xs" variant="link" onClick={clearAllFilters}>Сбросить все</Button>
          </WrapItem>
        </Wrap>
      ) : (
        <Box mb={6} />
      )}

      {!filtered ? (
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={5}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} h="280px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      ) : filtered.length === 0 ? (
        <Center flexDirection="column" gap={3} py={10}>
          <Icon as={Search} boxSize={8} color="textFaint" strokeWidth={1.5} />
          <Text color="textMuted">Ничего не найдено{q.trim() ? ` по запросу «${q.trim()}»` : ""}</Text>
          <Button size="sm" onClick={clearAllFilters}>Сбросить фильтры</Button>
        </Center>
      ) : (
        <>
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={5}>
            {filtered.slice(0, visibleCount).map((p) => (
              <ProductCard
                key={p.slug}
                product={p}
                onQuickView={setQuickViewProduct}
                highlightTerm={q}
                showCompare={category === "БАД"}
              />
            ))}
          </SimpleGrid>
          {filtered.length > visibleCount ? (
            <Center mt={8}>
              <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Показать ещё ({filtered.length - visibleCount})
              </Button>
            </Center>
          ) : null}
        </>
      )}

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </Box>
  );
}
