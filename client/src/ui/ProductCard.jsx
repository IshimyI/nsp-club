import { useState } from "react";
import { Box, Image, Text, VStack, Button, useToast, Badge, IconButton, Checkbox, Icon } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import Heart from "lucide-react/dist/esm/icons/heart";
import Eye from "lucide-react/dist/esm/icons/eye";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import PriceTag from "./PriceTag";
import HighlightText from "./HighlightText";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useCompare } from "../context/CompareContext";
import { prefetchProduct } from "../api";

export default function ProductCard({ product, onQuickView, highlightTerm, showCompare }) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isComparing, toggleCompare, slugs: compareSlugs, MAX_COMPARE } = useCompare();
  const toast = useToast();
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleAdd = () => {
    addItem(product, 1);
    toast({
      title: `«${product.name}» добавлен в заявку`,
      status: "success",
      duration: 1800,
      isClosable: true,
      position: "bottom",
    });
  };

  const discountPct =
    product.priceRetailUsd && product.priceDiscountUsd
      ? Math.round(
          ((product.priceRetailUsd - product.priceDiscountUsd) / product.priceRetailUsd) * 100
        )
      : null;

  const favorite = isFavorite(product.slug);
  const comparing = isComparing(product.slug);
  const compareDisabled = !comparing && compareSlugs.length >= MAX_COMPARE;

  return (
    <Box
      role="group"
      borderWidth="1px"
      borderColor="borderColor"
      borderRadius="lg"
      overflow="hidden"
      bg="cardBg"
      display="flex"
      flexDirection="column"
      position="relative"
      transition="box-shadow 0.2s, transform 0.2s"
      _hover={{
        boxShadow: "0 14px 28px -10px rgba(50, 88, 59, 0.35)",
        _dark: { boxShadow: "0 14px 28px -10px rgba(0, 0, 0, 0.5)" },
        transform: "translateY(-3px)",
      }}
      onMouseEnter={() => prefetchProduct(product.slug)}
    >
      {discountPct ? (
        <Badge
          position="absolute"
          top="8px"
          left="8px"
          zIndex="1"
          bgGradient="linear(135deg, gold.300, gold.500)"
          color="nsp.900"
          borderRadius="full"
          px="8px"
          fontSize="0.7rem"
        >
          −{discountPct}%
        </Badge>
      ) : null}
      <IconButton
        aria-label={favorite ? "Убрать из избранного" : "В избранное"}
        icon={
          <Icon
            as={Heart}
            boxSize={4}
            color={favorite ? "red.400" : "textFaint"}
            fill={favorite ? "currentColor" : "none"}
            strokeWidth={1.75}
          />
        }
        size="sm"
        variant="ghost"
        position="absolute"
        top="8px"
        right={onQuickView ? "44px" : "8px"}
        zIndex="1"
        bg="cardBg"
        boxShadow="sm"
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(product.slug);
        }}
      />
      {onQuickView ? (
        <IconButton
          aria-label="Быстрый просмотр"
          icon={<Icon as={Eye} boxSize={4} strokeWidth={1.75} />}
          size="sm"
          position="absolute"
          top="8px"
          right="8px"
          zIndex="1"
          bg="cardBg"
          boxShadow="sm"
          onClick={(e) => {
            e.preventDefault();
            onQuickView(product);
          }}
        />
      ) : null}
      <RouterLink to={`/product/${product.slug}`}>
        <Box bg="subtleBg" h="180px" display="flex" alignItems="center" justifyContent="center" overflow="hidden">
          {product.images?.[0] ? (
            <Image
              src={`/images/${product.images[0]}`}
              alt={product.name}
              maxH="170px"
              objectFit="contain"
              loading="lazy"
              opacity={imgLoaded ? 1 : 0}
              transition="opacity 0.3s, transform 0.3s"
              _groupHover={{ transform: "scale(1.06)" }}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <VStack spacing={1} color="textFaint">
              <Icon as={Leaf} boxSize={6} strokeWidth={1.5} />
              <Text fontSize="xs">Нет фото</Text>
            </VStack>
          )}
        </Box>
      </RouterLink>
      <VStack align="start" p={4} spacing={2} flex="1">
        <RouterLink to={`/product/${product.slug}`}>
          <HighlightText
            text={product.name}
            term={highlightTerm}
            fontWeight="700"
            noOfLines={2}
            minH="2.8em"
          />
        </RouterLink>
        <Text fontSize="xs" color="textFaint">Арт. {product.article}</Text>
        <PriceTag
          priceRetailUsd={product.priceRetailUsd}
          priceDiscountUsd={product.priceDiscountUsd}
        />
        <Button size="sm" w="100%" mt="auto" onClick={handleAdd}>
          В заявку
        </Button>
        {showCompare ? (
          <Checkbox
            size="sm"
            isChecked={comparing}
            isDisabled={compareDisabled}
            onChange={() => toggleCompare(product.slug)}
          >
            <Text fontSize="xs" color="textFaint">Сравнить</Text>
          </Checkbox>
        ) : null}
      </VStack>
    </Box>
  );
}
