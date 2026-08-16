import { useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
} from "@chakra-ui/react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useDocumentMeta from "../useDocumentMeta";

const PHONE_RE = /^[+\d][\d\s()-]{6,20}$/;

export default function LoginPage() {
  useDocumentMeta("Вход — NSP Club", "Войдите в аккаунт NSP Club, чтобы видеть историю своих заявок.");
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState("");

  if (user) return <Navigate to="/account" replace />;

  const onLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginSubmitting(true);
    try {
      await login(loginPhone.trim(), loginPassword);
      toast({ title: "Вы вошли в аккаунт", status: "success", duration: 2000, isClosable: true });
      navigate("/account");
    } catch (err) {
      setLoginError(err.response?.data?.error || "Не удалось войти");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    if (regName.trim().length < 2 || !PHONE_RE.test(regPhone.trim()) || regPassword.length < 6) {
      setRegError("Проверьте имя, телефон и пароль (мин. 6 символов)");
      return;
    }
    setRegSubmitting(true);
    try {
      await register(regName.trim(), regPhone.trim(), regPassword);
      toast({ title: "Аккаунт создан", status: "success", duration: 2000, isClosable: true });
      navigate("/account");
    } catch (err) {
      setRegError(err.response?.data?.error || "Не удалось зарегистрироваться");
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <Box maxW="420px" mx="auto">
      <Heading size="lg" mb={6}>Аккаунт</Heading>
      <Tabs colorScheme="nsp" isFitted>
        <TabList>
          <Tab>Вход</Tab>
          <Tab>Регистрация</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            <VStack as="form" onSubmit={onLogin} align="stretch" spacing={4}>
              <FormControl isRequired isInvalid={!!loginError}>
                <FormLabel>Телефон</FormLabel>
                <Input
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+7 900 123-45-67"
                  bg="cardBg"
                />
              </FormControl>
              <FormControl isRequired isInvalid={!!loginError}>
                <FormLabel>Пароль</FormLabel>
                <Input
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  bg="cardBg"
                />
                <FormErrorMessage>{loginError}</FormErrorMessage>
              </FormControl>
              <Button type="submit" isLoading={loginSubmitting}>Войти</Button>
            </VStack>
          </TabPanel>
          <TabPanel px={0}>
            <VStack as="form" onSubmit={onRegister} align="stretch" spacing={4}>
              <FormControl isRequired isInvalid={!!regError}>
                <FormLabel>Имя</FormLabel>
                <Input value={regName} onChange={(e) => setRegName(e.target.value)} autoComplete="name" bg="cardBg" />
              </FormControl>
              <FormControl isRequired isInvalid={!!regError}>
                <FormLabel>Телефон</FormLabel>
                <Input
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+7 900 123-45-67"
                  bg="cardBg"
                />
              </FormControl>
              <FormControl isRequired isInvalid={!!regError}>
                <FormLabel>Пароль</FormLabel>
                <Input
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  bg="cardBg"
                />
                <FormErrorMessage>{regError}</FormErrorMessage>
              </FormControl>
              <Text fontSize="xs" color="textFaint">
                Аккаунт нужен только чтобы видеть историю своих заявок — оформить заказ можно и без него.
              </Text>
              <Button type="submit" isLoading={regSubmitting}>Создать аккаунт</Button>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
