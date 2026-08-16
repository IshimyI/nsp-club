import { useEffect, useState } from "react";
import { IconButton } from "@chakra-ui/react";
import { ChevronUpIcon } from "@chakra-ui/icons";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <IconButton
      aria-label="Наверх"
      icon={<ChevronUpIcon boxSize={6} />}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      position="fixed"
      bottom="24px"
      right="24px"
      borderRadius="full"
      size="lg"
      bg="nsp.700"
      color="white"
      _hover={{ bg: "nsp.800" }}
      boxShadow="lg"
      zIndex="99"
    />
  );
}
