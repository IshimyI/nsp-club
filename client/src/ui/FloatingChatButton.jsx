import { VStack, IconButton, Icon } from "@chakra-ui/react";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Send from "lucide-react/dist/esm/icons/send";
import { CONTACTS } from "../contactConfig";

export default function FloatingChatButton() {
  const buttons = [
    CONTACTS.whatsapp
      ? { key: "whatsapp", href: `https://wa.me/${CONTACTS.whatsapp}`, icon: MessageCircle, bg: "green.500", label: "Написать в WhatsApp" }
      : null,
    CONTACTS.telegram
      ? { key: "telegram", href: `https://t.me/${CONTACTS.telegram}`, icon: Send, bg: "blue.400", label: "Написать в Telegram" }
      : null,
  ].filter(Boolean);

  if (buttons.length === 0) return null;

  return (
    <VStack position="fixed" bottom="24px" left="24px" spacing={3} zIndex="99">
      {buttons.map((b) => (
        <IconButton
          key={b.key}
          as="a"
          href={b.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={b.label}
          icon={<Icon as={b.icon} boxSize={6} color="white" strokeWidth={1.75} />}
          bg={b.bg}
          _hover={{ opacity: 0.9 }}
          borderRadius="full"
          size="lg"
          boxShadow="lg"
        />
      ))}
    </VStack>
  );
}
