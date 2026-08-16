import { HStack, Link as ChakraLink, Icon, Text } from "@chakra-ui/react";
import Phone from "lucide-react/dist/esm/icons/phone";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Send from "lucide-react/dist/esm/icons/send";
import Mail from "lucide-react/dist/esm/icons/mail";
import { CONTACTS } from "../contactConfig";

const CHANNELS = [
  {
    key: "phone",
    label: (v) => v,
    href: (v) => `tel:${v.replace(/[^\d+]/g, "")}`,
    icon: Phone,
    color: "nsp.600",
  },
  {
    key: "whatsapp",
    label: () => "WhatsApp",
    href: (v) => `https://wa.me/${v}`,
    icon: MessageCircle,
    color: "green.500",
  },
  {
    key: "telegram",
    label: () => "Telegram",
    href: (v) => `https://t.me/${v}`,
    icon: Send,
    color: "blue.400",
  },
  {
    key: "email",
    label: (v) => v,
    href: (v) => `mailto:${v}`,
    icon: Mail,
    color: "gold.600",
  },
];

export default function ContactLinks({ spacing = 4 }) {
  const active = CHANNELS.filter((c) => CONTACTS[c.key]);
  if (active.length === 0) return null;

  return (
    <HStack spacing={spacing} flexWrap="wrap">
      {active.map((c) => (
        <ChakraLink
          key={c.key}
          href={c.href(CONTACTS[c.key])}
          isExternal={c.key !== "phone"}
          display="flex"
          alignItems="center"
          gap={2}
          fontWeight="600"
          color="textPrimary"
          _hover={{ color: c.color, textDecoration: "none" }}
        >
          <Icon as={c.icon} boxSize={5} color={c.color} strokeWidth={1.75} />
          <Text>{c.label(CONTACTS[c.key])}</Text>
        </ChakraLink>
      ))}
    </HStack>
  );
}
