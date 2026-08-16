import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Button,
  Divider,
  Checkbox,
  Link as ChakraLink,
  useToast,
  Center,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { submitOrder } from "../api";
import useRate from "../useRate";

const PHONE_RE = /^[+\d][\d\s()-]{6,20}$/;
const COMMENT_MAX = 500;

export default function OrderPage() {
  const { items, setQty, removeItem, clear, totalUsd } = useCart();
  const { user } = useAuth();
  const rub = useRate();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot — real users never fill this
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name);
      setPhone((prev) => prev || user.phone);
    }
  }, [user]);

  const phoneValid = PHONE_RE.test(phone.trim());
  const nameValid = name.trim().length >= 2;
  const canSubmit = nameValid && phoneValid && consent;

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    if (website) return; // honeypot tripped — silently drop
    setSubmitting(true);
    try {
      await submitOrder({
        name: name.trim(),
        phone: phone.trim(),
        comment: comment.trim().slice(0, COMMENT_MAX),
        website,
        items: items.map((i) => ({ name: i.name, article: i.article, qty: i.qty })),
      });
      clear();
      setDone(true);
    } catch {
      toast({
        title: "Не удалось отправить заявку",
        description: "Попробуйте ещё раз или напишите нам напрямую.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Center py={20} flexDirection="column" gap={4} textAlign="center">
        <Heading size="lg">Заявка отправлена!</Heading>
        <Text color="textMuted" maxW="500px">
          Мы свяжемся с вами в ближайшее время, чтобы подтвердить наличие и итоговую цену в рублях.
        </Text>
        <Button as={RouterLink} to="/catalog">Вернуться в каталог</Button>
      </Center>
    );
  }

  if (items.length === 0) {
    return (
      <Center py={20} flexDirection="column" gap={4} textAlign="center">
        <Heading size="lg">Заявка пуста</Heading>
        <Text color="textMuted">Добавьте товары из каталога, чтобы оформить заказ.</Text>
        <Button as={RouterLink} to="/catalog">В каталог</Button>
      </Center>
    );
  }

  return (
    <Box maxW="700px" mx="auto">
      <Heading size="lg" mb={6}>Ваша заявка</Heading>

      <VStack align="stretch" spacing={4} mb={6}>
        {items.map((i) => (
          <HStack key={i.slug} borderWidth="1px" borderColor="borderColor" borderRadius="md" p={3} spacing={4}>
            {i.image ? (
              <Image src={`/images/${i.image}`} boxSize="50px" objectFit="contain" />
            ) : null}
            <Box flex="1">
              <Text fontWeight="600" noOfLines={1}>{i.name}</Text>
              <Text fontSize="xs" color="textFaint">Арт. {i.article}</Text>
            </Box>
            <NumberInput
              value={i.qty}
              onChange={(_, v) => setQty(i.slug, Number.isNaN(v) ? 1 : v)}
              min={1}
              max={50}
              w="90px"
              size="sm"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <IconButton
              aria-label="Удалить"
              icon={<DeleteIcon />}
              size="sm"
              variant="ghost"
              onClick={() => removeItem(i.slug)}
            />
          </HStack>
        ))}
      </VStack>

      <Text textAlign="right" fontWeight="700" mb={6}>
        Ориентировочно: {rub ? `${Math.round(totalUsd * rub).toLocaleString("ru-RU")} ₽` : `$${totalUsd.toFixed(2)}`}
        {rub ? (
          <Text as="span" fontWeight="400" color="textFaint">
            {" "}
            (≈ ${totalUsd.toFixed(2)})
          </Text>
        ) : null}
      </Text>

      <Divider mb={6} />

      <Heading size="md" mb={4}>Оформление</Heading>
      <VStack as="form" onSubmit={onSubmit} align="stretch" spacing={4} noValidate>
        {/* Honeypot: hidden from real users, bots that auto-fill every field
            trip it. Keep the off-screen positioning — display:none fields
            get skipped by some bots and defeat the point. */}
        <Box position="absolute" left="-9999px" aria-hidden="true">
          <Input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </Box>

        <FormControl isRequired isInvalid={touched && !nameValid}>
          <FormLabel>Имя</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} bg="cardBg" autoComplete="name" />
          <FormErrorMessage>Укажите имя</FormErrorMessage>
        </FormControl>
        <FormControl isRequired isInvalid={touched && !phoneValid}>
          <FormLabel>Телефон</FormLabel>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            bg="cardBg"
            placeholder="+7 900 123-45-67"
            type="tel"
            autoComplete="tel"
          />
          <FormErrorMessage>Введите корректный номер телефона</FormErrorMessage>
        </FormControl>
        <FormControl>
          <FormLabel>Комментарий</FormLabel>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
            bg="cardBg"
            maxLength={COMMENT_MAX}
          />
          <Text fontSize="xs" color="textFaint" textAlign="right" mt={1}>
            {comment.length}/{COMMENT_MAX}
          </Text>
        </FormControl>

        <FormControl isRequired isInvalid={touched && !consent}>
          <Checkbox isChecked={consent} onChange={(e) => setConsent(e.target.checked)}>
            Я согласен(на) на{" "}
            <ChakraLink as={RouterLink} to="/privacy" color="nsp.600" textDecoration="underline">
              обработку персональных данных
            </ChakraLink>
          </Checkbox>
          <FormErrorMessage>Нужно согласие на обработку данных</FormErrorMessage>
        </FormControl>

        <Button type="submit" size="lg" isLoading={submitting}>
          Отправить заявку
        </Button>
      </VStack>
    </Box>
  );
}
