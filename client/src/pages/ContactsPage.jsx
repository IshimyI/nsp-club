import { Box, Heading, Text, VStack, Button } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import useDocumentMeta from "../useDocumentMeta";
import ContactLinks from "../ui/ContactLinks";
import { CONTACTS, DISTRIBUTOR } from "../contactConfig";

export default function ContactsPage() {
  useDocumentMeta("Контакты — NSP Club", "Как связаться и оформить заказ продукции NSP.");
  const hasContacts = CONTACTS.phone || CONTACTS.whatsapp || CONTACTS.telegram || CONTACTS.email;
  return (
    <Box maxW="600px">
      <Heading size="lg" mb={5}>Контакты</Heading>
      <VStack align="start" spacing={4} color="textMuted">
        <Text>
          Самый быстрый способ заказать — оформить заявку в каталоге, мы перезвоним и
          уточним детали.
        </Text>
        {hasContacts ? <ContactLinks /> : null}
        {DISTRIBUTOR.id ? (
          <Text fontSize="sm" color="textFaint">
            Независимый дистрибьютор NSP: {DISTRIBUTOR.name}, номер дистрибьютора {DISTRIBUTOR.id}.
          </Text>
        ) : null}
        <Button as={RouterLink} to="/catalog">Перейти в каталог</Button>
      </VStack>
    </Box>
  );
}
