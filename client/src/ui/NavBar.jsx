import {
  Box,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Link as ChakraLink,
  Badge,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Stack,
  Divider,
  useDisclosure,
  useColorMode,
  Icon,
  Image,
} from "@chakra-ui/react";
import Search from "lucide-react/dist/esm/icons/search";
import MenuIcon from "lucide-react/dist/esm/icons/menu";
import Sun from "lucide-react/dist/esm/icons/sun";
import Moon from "lucide-react/dist/esm/icons/moon";
import Heart from "lucide-react/dist/esm/icons/heart";
import ShoppingBag from "lucide-react/dist/esm/icons/shopping-bag";
import User from "lucide-react/dist/esm/icons/user";
import { Link as RouterLink, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import { fetchProducts } from "../api";
import logo from "../assets/logo.png";

export default function NavBar() {
  const { totalCount } = useCart();
  const { slugs: favoriteSlugs } = useFavorites();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [allProducts, setAllProducts] = useState(null);
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (q.trim().length >= 2 && !allProducts) {
      fetchProducts().then(setAllProducts);
    }
  }, [q, allProducts]);

  const suggestions = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2 || !allProducts) return [];
    return allProducts.filter((p) => p.name.toLowerCase().includes(needle)).slice(0, 6);
  }, [q, allProducts]);

  const onSearch = (e) => {
    e.preventDefault();
    setSuggestOpen(false);
    navigate(q.trim() ? `/catalog?q=${encodeURIComponent(q.trim())}` : "/catalog");
    onClose();
  };

  const goToProduct = (slug) => {
    setSuggestOpen(false);
    setQ("");
    navigate(`/product/${slug}`);
    onClose();
  };

  return (
    <Box
      bgGradient="linear(120deg, nsp.800, nsp.600)"
      color="white"
      position="sticky"
      top="0"
      zIndex="100"
      boxShadow="sm"
      transition="all 0.15s"
    >
      <Flex
        maxW="1200px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={scrolled ? 2 : 3}
        align="center"
        gap={4}
        transition="padding 0.15s"
      >
        <ChakraLink
          as={RouterLink}
          to="/"
          display="flex"
          alignItems="center"
          gap={2}
          fontWeight="800"
          fontSize={scrolled ? "lg" : "xl"}
          transition="font-size 0.15s"
          _hover={{ textDecoration: "none" }}
        >
          <Image src={logo} alt="" boxSize={scrolled ? "28px" : "34px"} borderRadius="full" transition="width 0.15s, height 0.15s" />
          NSP Club
        </ChakraLink>

        <HStack spacing={5} display={{ base: "none", md: "flex" }} fontWeight="600">
          <ChakraLink as={RouterLink} to="/catalog">Каталог</ChakraLink>
          <ChakraLink as={RouterLink} to="/about">О продукции NSP</ChakraLink>
          <ChakraLink as={RouterLink} to="/contacts">Контакты</ChakraLink>
        </HStack>

        <Box
          flex="1"
          minW="120px"
          as="form"
          onSubmit={onSearch}
          display={{ base: "none", sm: "block" }}
          position="relative"
        >
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={Search} boxSize={4} color="whiteAlpha.700" strokeWidth={2} />
            </InputLeftElement>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
              placeholder="Поиск по каталогу..."
              bg="whiteAlpha.200"
              border="none"
              _placeholder={{ color: "whiteAlpha.700" }}
              borderRadius="full"
            />
          </InputGroup>
          {suggestOpen && suggestions.length > 0 ? (
            <Box
              position="absolute"
              top="100%"
              left="0"
              right="0"
              mt={1}
              bg="cardBg"
              color="textPrimary"
              borderRadius="md"
              boxShadow="lg"
              overflow="hidden"
              zIndex="200"
            >
              {suggestions.map((p) => (
                <Box
                  key={p.slug}
                  as="button"
                  type="button"
                  w="100%"
                  textAlign="left"
                  px={3}
                  py={2}
                  fontSize="sm"
                  _hover={{ bg: "subtleBg" }}
                  onClick={() => goToProduct(p.slug)}
                >
                  {p.name}
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>

        <Box flex={{ base: "1", sm: "initial" }} display={{ base: "flex", sm: "none" }} />

        <ChakraLink
          as={RouterLink}
          to={user ? "/account" : "/login"}
          display={{ base: "none", sm: "inline-block" }}
        >
          <IconButton
            aria-label={user ? "Мой аккаунт" : "Вход"}
            icon={<Icon as={User} boxSize={5} strokeWidth={1.75} />}
            variant="ghost"
            color="white"
            _hover={{ bg: "whiteAlpha.200" }}
          />
        </ChakraLink>

        <ChakraLink as={RouterLink} to="/favorites" position="relative" display={{ base: "none", sm: "inline-block" }}>
          <IconButton
            aria-label="Избранное"
            icon={<Icon as={Heart} boxSize={5} strokeWidth={1.75} />}
            variant="ghost"
            color="white"
            _hover={{ bg: "whiteAlpha.200" }}
          />
          {favoriteSlugs.length > 0 ? (
            <Badge
              position="absolute"
              top="-4px"
              right="-4px"
              borderRadius="full"
              bgGradient="linear(135deg, gold.300, gold.500)"
              color="nsp.900"
              fontSize="0.65rem"
              px="6px"
            >
              {favoriteSlugs.length}
            </Badge>
          ) : null}
        </ChakraLink>

        <ChakraLink as={RouterLink} to="/order" position="relative">
          <IconButton
            aria-label="Заявка на заказ"
            icon={<Icon as={ShoppingBag} boxSize={5} strokeWidth={1.75} />}
            variant="ghost"
            color="white"
            _hover={{ bg: "whiteAlpha.200" }}
          />
          {totalCount > 0 ? (
            <Badge
              position="absolute"
              top="-4px"
              right="-4px"
              borderRadius="full"
              bgGradient="linear(135deg, gold.300, gold.500)"
              color="nsp.900"
              fontSize="0.65rem"
              px="6px"
            >
              {totalCount}
            </Badge>
          ) : null}
        </ChakraLink>

        <IconButton
          aria-label={colorMode === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
          icon={<Icon as={colorMode === "light" ? Moon : Sun} boxSize={4} strokeWidth={1.75} />}
          onClick={toggleColorMode}
          size="sm"
          variant="ghost"
          color="white"
          _hover={{ bg: "whiteAlpha.200" }}
        />

        <IconButton
          aria-label="Открыть меню"
          icon={<Icon as={MenuIcon} boxSize={5} strokeWidth={1.75} />}
          onClick={onOpen}
          display={{ base: "inline-flex", md: "none" }}
          variant="ghost"
          color="white"
          _hover={{ bg: "whiteAlpha.200" }}
        />
      </Flex>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="cardBg" color="textPrimary">
          <DrawerCloseButton />
          <DrawerHeader>Меню</DrawerHeader>
          <DrawerBody>
            <Box as="form" onSubmit={onSearch} mb={5} display={{ base: "block", sm: "none" }}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} boxSize={4} color="textFaint" strokeWidth={2} />
                </InputLeftElement>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Поиск по каталогу..."
                  bg="subtleBg"
                  borderRadius="full"
                />
              </InputGroup>
            </Box>
            <Stack spacing={4} fontSize="md" fontWeight="600" onClick={onClose}>
              <ChakraLink as={NavLink} to="/catalog">Каталог</ChakraLink>
              <ChakraLink as={NavLink} to="/about">О продукции NSP</ChakraLink>
              <ChakraLink as={NavLink} to="/contacts">Контакты</ChakraLink>
              <ChakraLink as={NavLink} to="/favorites">Избранное{favoriteSlugs.length ? ` (${favoriteSlugs.length})` : ""}</ChakraLink>
              <ChakraLink as={NavLink} to={user ? "/account" : "/login"}>{user ? "Мой аккаунт" : "Вход"}</ChakraLink>
              <Divider />
              <ChakraLink as={NavLink} to="/order">Заявка на заказ{totalCount ? ` (${totalCount})` : ""}</ChakraLink>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
