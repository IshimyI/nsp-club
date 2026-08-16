import { Box, Flex, Text, Link as ChakraLink, Stack, HStack, Divider, Image } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <Box as="footer" bgGradient="linear(200deg, nsp.900, nsp.800)" color="whiteAlpha.800" mt={16} py={10}>
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} fontSize="sm">
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" gap={8} mb={6}>
          <Box maxW="360px">
            <HStack spacing={2} mb={2}>
              <Image src={logo} alt="" boxSize="28px" borderRadius="full" />
              <Text fontWeight="700" color="white" fontSize="md">NSP Club</Text>
            </HStack>
            <Text>Независимый дистрибьютор Nature&apos;s Sunshine Products (NSP). С вами с 2023 года.</Text>
          </Box>

          <Stack spacing={1}>
            <Text fontWeight="700" color="white" mb={1}>Разделы</Text>
            <ChakraLink as={RouterLink} to="/catalog">Каталог</ChakraLink>
            <ChakraLink as={RouterLink} to="/about">О продукции NSP</ChakraLink>
            <ChakraLink as={RouterLink} to="/contacts">Контакты</ChakraLink>
            <ChakraLink as={RouterLink} to="/faq">Вопросы и ответы</ChakraLink>
            <ChakraLink as={RouterLink} to="/how-to-read-label">Как читать состав БАД</ChakraLink>
            <ChakraLink as={RouterLink} to="/favorites">Избранное</ChakraLink>
            <ChakraLink as={RouterLink} to="/order">Заявка на заказ</ChakraLink>
          </Stack>

          <Stack spacing={1}>
            <Text fontWeight="700" color="white" mb={1}>Информация</Text>
            <ChakraLink href="https://naturessunshine.ru" isExternal color="gold.400">
              Официальный сайт NSP
            </ChakraLink>
            <ChakraLink as={RouterLink} to="/delivery">Доставка и оплата</ChakraLink>
            <ChakraLink as={RouterLink} to="/returns">Возврат и обмен</ChakraLink>
            <ChakraLink as={RouterLink} to="/terms">Публичная оферта</ChakraLink>
            <ChakraLink as={RouterLink} to="/privacy">Политика конфиденциальности</ChakraLink>
          </Stack>
        </Flex>

        <Divider borderColor="whiteAlpha.300" mb={4} />

        <HStack justify="space-between" flexWrap="wrap" gap={2} color="whiteAlpha.600" fontSize="xs">
          <Text>© {new Date().getFullYear()} NSP Club</Text>
          <Text>Продукция не является лекарственным средством</Text>
        </HStack>
      </Box>
    </Box>
  );
}
