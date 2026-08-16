import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  Grid,
  Box,
  Image,
  Heading,
  Text,
  Button,
  VStack,
  Center,
  Icon,
} from "@chakra-ui/react";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import { Link as RouterLink } from "react-router-dom";
import PriceTag from "./PriceTag";
import { useCart } from "../context/CartContext";

export default function QuickViewModal({ product, isOpen, onClose }) {
  const { addItem } = useCart();
  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent bg="cardBg">
        <ModalCloseButton />
        <ModalBody p={6}>
          <Grid templateColumns={{ base: "1fr", sm: "160px 1fr" }} gap={5}>
            <Box bg="subtleBg" borderRadius="md" p={3}>
              {product.images?.[0] ? (
                <Image
                  src={`/images/${product.images[0]}`}
                  alt={product.name}
                  maxH="160px"
                  mx="auto"
                  objectFit="contain"
                />
              ) : (
                <Center h="160px" color="textFaint">
                  <Icon as={Leaf} boxSize={6} strokeWidth={1.5} />
                </Center>
              )}
            </Box>
            <VStack align="start" spacing={2}>
              <Heading size="md">{product.name}</Heading>
              <Text fontSize="sm" color="textFaint">Арт. {product.article}</Text>
              <PriceTag
                priceRetailUsd={product.priceRetailUsd}
                priceDiscountUsd={product.priceDiscountUsd}
                size="lg"
              />
              {product.highlights?.[0] ? (
                <Text fontSize="sm" color="textMuted" noOfLines={3}>
                  {product.highlights[0]}
                </Text>
              ) : null}
              <VStack align="stretch" w="100%" spacing={2} pt={2}>
                <Button
                  onClick={() => {
                    addItem(product, 1);
                    onClose();
                  }}
                >
                  В заявку
                </Button>
                <Button as={RouterLink} to={`/product/${product.slug}`} variant="outline" onClick={onClose}>
                  Подробнее
                </Button>
              </VStack>
            </VStack>
          </Grid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
