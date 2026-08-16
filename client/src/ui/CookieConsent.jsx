import { useEffect, useState } from "react";
import { Flex, Text, Button, Link as ChakraLink } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

const STORAGE_KEY = "nsp-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Flex
      bg="cardBg"
      borderBottom="1px solid"
      borderColor="borderColor"
      p={4}
      gap={4}
      align="center"
      flexWrap="wrap"
      justify="center"
    >
      <Text fontSize="sm" color="textMuted" maxW="640px">
        Сайт использует файлы cookie и обрабатывает персональные данные, указанные в форме заявки,
        в соответствии с{" "}
        <ChakraLink as={RouterLink} to="/privacy" color="nsp.600" _dark={{ color: "nsp.300" }}>
          политикой конфиденциальности
        </ChakraLink>
        . Продолжая пользоваться сайтом, вы соглашаетесь с этим.
      </Text>
      <Button size="sm" onClick={accept} flexShrink={0}>
        Понятно
      </Button>
    </Flex>
  );
}
