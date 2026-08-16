import { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Box,
  useToast,
} from "@chakra-ui/react";
import { submitOrder } from "../api";

const PHONE_RE = /^[+\d][\d\s()-]{6,20}$/;

export default function OneClickOrderModal({ product, isOpen, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  if (!product) return null;

  const handleClose = () => {
    setDone(false);
    setName("");
    setPhone("");
    onClose();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2 || !PHONE_RE.test(phone.trim())) return;
    if (website) return;
    setSubmitting(true);
    try {
      await submitOrder({
        name: name.trim(),
        phone: phone.trim(),
        comment: "Заказ в один клик",
        website,
        items: [{ name: product.name, article: product.article, qty: 1 }],
      });
      setDone(true);
    } catch {
      toast({ title: "Не удалось отправить заявку", status: "error", duration: 3000, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="cardBg">
        <ModalHeader>{done ? "Заявка отправлена!" : "Заказать в один клик"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {done ? (
            <VStack align="start" spacing={3}>
              <Text color="textMuted">Мы свяжемся с вами в ближайшее время, чтобы подтвердить заказ «{product.name}».</Text>
              <Button onClick={handleClose}>Закрыть</Button>
            </VStack>
          ) : (
            <VStack as="form" onSubmit={onSubmit} align="stretch" spacing={4}>
              <Text color="textMuted" fontSize="sm">
                «{product.name}» — оставьте имя и телефон, мы перезвоним и уточним детали.
              </Text>
              <Box position="absolute" left="-9999px" aria-hidden="true">
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
              </Box>
              <FormControl isRequired>
                <FormLabel>Имя</FormLabel>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Телефон</FormLabel>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 900 123-45-67"
                  type="tel"
                  autoComplete="tel"
                />
              </FormControl>
              <Button type="submit" isLoading={submitting}>Отправить</Button>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
