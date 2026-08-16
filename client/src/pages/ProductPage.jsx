import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Grid,
  GridItem,
  Image,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  List,
  ListItem,
  ListIcon,
  Divider,
  Center,
  Skeleton,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  IconButton,
  useDisclosure,
  useToast,
  Icon,
} from "@chakra-ui/react";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Copy from "lucide-react/dist/esm/icons/copy";
import Heart from "lucide-react/dist/esm/icons/heart";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import Zap from "lucide-react/dist/esm/icons/zap";
import { fetchProduct, fetchProducts } from "../api";
import PriceTag from "../ui/PriceTag";
import ProductCard from "../ui/ProductCard";
import OneClickOrderModal from "../ui/OneClickOrderModal";
import { useCart } from "../context/CartContext";
import { useRecentlyViewed } from "../context/RecentlyViewedContext";
import { useFavorites } from "../context/FavoritesContext";
import useDocumentMeta from "../useDocumentMeta";
import useProductJsonLd from "../useProductJsonLd";
import useJsonLd from "../useJsonLd";

const SITE_ORIGIN = "https://nsp-club.ru";

const SECTION_ORDER = [
  "Преимущества",
  "Активные ингредиенты",
  "Состав",
  "Применение",
  "Противопоказания",
];

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { markViewed } = useRecentlyViewed();
  const { isFavorite, toggleFavorite } = useFavorites();
  const toast = useToast();
  const lightbox = useDisclosure();
  const oneClick = useDisclosure();

  useEffect(() => {
    if (!lightbox.isOpen || !product?.images?.length) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setActiveImg((i) => (i - 1 + product.images.length) % product.images.length);
      } else if (e.key === "ArrowRight") {
        setActiveImg((i) => (i + 1) % product.images.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox.isOpen, product]);

  useEffect(() => {
    setProduct(null);
    setActiveImg(0);
    setQty(1);
    fetchProduct(slug).then(setProduct);
    markViewed(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    fetchProducts().then(setAllProducts);
  }, []);

  useDocumentMeta(
    product ? `${product.name} — NSP Club` : undefined,
    product?.highlights?.length
      ? `${product.name}: ${product.highlights[0]} Артикул ${product.article}.`
      : product
        ? `${product.name} — купить с доставкой. Артикул ${product.article}.`
        : undefined
  );

  useProductJsonLd(product);
  useJsonLd(
    product
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Каталог", item: `${SITE_ORIGIN}/catalog` },
            ...(product.category
              ? [
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: product.category,
                    item: `${SITE_ORIGIN}/catalog?category=${encodeURIComponent(product.category)}`,
                  },
                ]
              : []),
            {
              "@type": "ListItem",
              position: product.category ? 3 : 2,
              name: product.name,
              item: `${SITE_ORIGIN}/product/${product.slug}`,
            },
          ],
        }
      : null
  );

  const related = useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts
      .filter((p) => p.slug !== product.slug && p.category === product.category)
      .filter((p) => !product.tags?.length || p.tags?.some((t) => product.tags.includes(t)))
      .slice(0, 4);
  }, [product, allProducts]);

  const handleAdd = () => {
    addItem(product, qty);
    toast({
      title: `«${product.name}» добавлен в заявку`,
      status: "success",
      duration: 1800,
      isClosable: true,
      position: "bottom",
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована", status: "success", duration: 1500, isClosable: true });
  };

  const handleCopyArticle = async () => {
    await navigator.clipboard.writeText(product.article);
    toast({ title: "Артикул скопирован", status: "success", duration: 1500, isClosable: true });
  };

  if (!product) {
    return (
      <Grid templateColumns={{ base: "1fr", md: "380px 1fr" }} gap={10}>
        <Skeleton h="360px" borderRadius="lg" />
        <VStack align="stretch" spacing={4}>
          <Skeleton h="32px" w="70%" />
          <Skeleton h="20px" w="40%" />
          <Skeleton h="28px" w="30%" />
          <Skeleton h="120px" />
        </VStack>
      </Grid>
    );
  }

  return (
    <Box pb={{ base: "76px", md: 0 }}>
      <Breadcrumb mb={6} fontSize="sm" color="textFaint">
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/catalog">Каталог</BreadcrumbLink>
        </BreadcrumbItem>
        {product.category ? (
          <BreadcrumbItem>
            <BreadcrumbLink
              as={RouterLink}
              to={`/catalog?category=${encodeURIComponent(product.category)}`}
            >
              {product.category}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ) : null}
        <BreadcrumbItem isCurrentPage>
          <Text noOfLines={1}>{product.name}</Text>
        </BreadcrumbItem>
      </Breadcrumb>

      <Grid templateColumns={{ base: "1fr", md: "380px 1fr" }} gap={10}>
        <GridItem>
          <Box
            bg="subtleBg"
            borderRadius="lg"
            p={4}
            mb={3}
            cursor={product.images?.length ? "zoom-in" : "default"}
            onClick={() => product.images?.length && lightbox.onOpen()}
          >
            {product.images?.length ? (
              <Image
                src={`/images/${product.images[activeImg]}`}
                alt={product.name}
                w="100%"
                maxH="360px"
                objectFit="contain"
                mx="auto"
              />
            ) : (
              <Center h="300px" flexDirection="column" color="textFaint" gap={2}>
                <Icon as={Leaf} boxSize={10} strokeWidth={1.5} />
                <Text>Нет фото</Text>
              </Center>
            )}
          </Box>
          {product.images?.length > 1 ? (
            <HStack spacing={2} overflowX="auto">
              {product.images.map((img, idx) => (
                <Box
                  key={img}
                  as="button"
                  aria-label={`Показать фото ${idx + 1} из ${product.images.length}`}
                  aria-pressed={idx === activeImg}
                  onClick={() => setActiveImg(idx)}
                  borderWidth="2px"
                  borderColor={idx === activeImg ? "nsp.500" : "borderColor"}
                  borderRadius="md"
                  overflow="hidden"
                  flexShrink={0}
                >
                  <Image src={`/images/${img}`} alt="" boxSize="60px" objectFit="cover" />
                </Box>
              ))}
            </HStack>
          ) : null}
        </GridItem>

        <GridItem>
          <Heading size="lg" mb={1}>{product.name}</Heading>
          {product.nameEn ? (
            <Text color="textFaint" mb={2}>{product.nameEn}</Text>
          ) : null}
          <HStack spacing={1} mb={4}>
            <Text fontSize="sm" color="textFaint">Артикул: {product.article}</Text>
            <IconButton
              aria-label="Скопировать артикул"
              icon={<Icon as={Copy} boxSize={3} strokeWidth={1.75} />}
              size="xs"
              variant="ghost"
              onClick={handleCopyArticle}
            />
          </HStack>

          <Box mb={5}>
            <PriceTag
              priceRetailUsd={product.priceRetailUsd}
              priceDiscountUsd={product.priceDiscountUsd}
              size="lg"
            />
          </Box>

          {product.highlights?.length ? (
            <List spacing={2} mb={6}>
              {product.highlights.map((h, idx) => (
                <ListItem key={idx} display="flex">
                  <ListIcon as={CheckCircle2} color="nsp.500" mt="4px" strokeWidth={1.75} />
                  <Text>{h}</Text>
                </ListItem>
              ))}
            </List>
          ) : null}

          <HStack spacing={3} display={{ base: "none", md: "flex" }}>
            <NumberInput
              value={qty}
              onChange={(_, v) => setQty(Number.isNaN(v) ? 1 : v)}
              min={1}
              max={50}
              w="100px"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Button onClick={handleAdd}>Добавить в заявку</Button>
            <IconButton
              aria-label="Поделиться"
              icon={<Icon as={Share2} boxSize={4} strokeWidth={1.75} />}
              variant="outline"
              onClick={handleShare}
            />
            <IconButton
              aria-label={isFavorite(product.slug) ? "Убрать из избранного" : "В избранное"}
              icon={
                <Icon
                  as={Heart}
                  boxSize={4}
                  color={isFavorite(product.slug) ? "red.400" : "currentColor"}
                  fill={isFavorite(product.slug) ? "currentColor" : "none"}
                  strokeWidth={1.75}
                />
              }
              variant="outline"
              onClick={() => toggleFavorite(product.slug)}
            />
          </HStack>
          <Button
            variant="link"
            colorScheme="gold"
            size="sm"
            mt={3}
            display={{ base: "none", md: "inline-flex" }}
            onClick={oneClick.onOpen}
          >
            Заказать в один клик →
          </Button>
        </GridItem>
      </Grid>

      <Divider my={10} />

      <VStack align="stretch" spacing={8} maxW="800px">
        {SECTION_ORDER.filter((h) => product.sections[h]).map((header) => (
          <Box key={header}>
            <Heading size="md" mb={2} color="nsp.700" _dark={{ color: "nsp.300" }}>{header}</Heading>
            {product.sections[header]
              .split(/\n{1,}/)
              .filter(Boolean)
              .map((para, idx) => (
                <Text key={idx} mb={2} whiteSpace="pre-wrap">{para}</Text>
              ))}
          </Box>
        ))}
      </VStack>

      {related.length > 0 ? (
        <Box mt={12}>
          <Heading size="md" mb={5}>Похожие товары</Heading>
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={5}>
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </SimpleGrid>
        </Box>
      ) : null}

      <Modal isOpen={lightbox.isOpen} onClose={lightbox.onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" bg="blackAlpha.600" borderRadius="full" />
          <ModalBody display="flex" alignItems="center" justifyContent="center" p={0} position="relative">
            {product.images?.length > 1 ? (
              <IconButton
                aria-label="Предыдущее фото"
                icon={<Icon as={ChevronLeft} boxSize={6} strokeWidth={2} />}
                position="absolute"
                left="-8px"
                borderRadius="full"
                bg="blackAlpha.600"
                color="white"
                _hover={{ bg: "blackAlpha.800" }}
                onClick={() =>
                  setActiveImg((i) => (i - 1 + product.images.length) % product.images.length)
                }
              />
            ) : null}
            {product.images?.length ? (
              <Image
                src={`/images/${product.images[activeImg]}`}
                alt={product.name}
                maxH="85vh"
                objectFit="contain"
                borderRadius="md"
              />
            ) : null}
            {product.images?.length > 1 ? (
              <IconButton
                aria-label="Следующее фото"
                icon={<Icon as={ChevronRight} boxSize={6} strokeWidth={2} />}
                position="absolute"
                right="-8px"
                borderRadius="full"
                bg="blackAlpha.600"
                color="white"
                _hover={{ bg: "blackAlpha.800" }}
                onClick={() => setActiveImg((i) => (i + 1) % product.images.length)}
              />
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>

      <HStack
        display={{ base: "flex", md: "none" }}
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        bg="cardBg"
        borderTop="1px solid"
        borderColor="borderColor"
        p={3}
        spacing={3}
        boxShadow="0 -2px 10px rgba(0,0,0,0.08)"
        zIndex="90"
      >
        <NumberInput
          value={qty}
          onChange={(_, v) => setQty(Number.isNaN(v) ? 1 : v)}
          min={1}
          max={50}
          w="90px"
          size="sm"
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Button onClick={handleAdd} flex="1">Добавить в заявку</Button>
        <IconButton
          aria-label="Заказать в один клик"
          icon={<Icon as={Zap} boxSize={4} strokeWidth={1.75} />}
          variant="outline"
          onClick={oneClick.onOpen}
        />
      </HStack>

      <OneClickOrderModal product={product} isOpen={oneClick.isOpen} onClose={oneClick.onClose} />
    </Box>
  );
}
