import { useEffect, useState } from "react";
import { Box, Heading, Text, VStack, HStack, Button, Badge, Divider, Center, Spinner } from "@chakra-ui/react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyOrders } from "../api";
import useDocumentMeta from "../useDocumentMeta";

export default function AccountPage() {
  useDocumentMeta("Мои заказы — NSP Club", "История ваших заявок на заказ NSP Club.");
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (user) fetchMyOrders().then(setOrders);
  }, [user]);

  if (loading) {
    return (
      <Center py={20}>
        <Spinner />
      </Center>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Box maxW="700px" mx="auto">
      <HStack justify="space-between" mb={2}>
        <Heading size="lg">Мой аккаунт</Heading>
        <Button variant="outline" size="sm" onClick={logout}>Выйти</Button>
      </HStack>
      <Text color="textMuted" mb={6}>
        {user.name} · {user.phone}
      </Text>

      <Heading size="md" mb={4}>Мои заявки</Heading>
      {!orders ? (
        <Center py={10}>
          <Spinner />
        </Center>
      ) : orders.length === 0 ? (
        <Text color="textMuted">Пока нет заявок.</Text>
      ) : (
        <VStack align="stretch" spacing={4}>
          {orders.map((o) => (
            <Box key={o.id} borderWidth="1px" borderColor="borderColor" borderRadius="md" p={4} bg="cardBg">
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color="textFaint">
                  {new Date(o.createdAt).toLocaleString("ru-RU")}
                </Text>
                <Badge colorScheme={o.processed ? "nsp" : "gray"}>
                  {o.processed ? "Обработана" : "Ожидает обработки"}
                </Badge>
              </HStack>
              <Divider mb={2} />
              <VStack align="stretch" spacing={1}>
                {(o.items || []).map((i, idx) => (
                  <Text key={idx} fontSize="sm">
                    {i.name} × {i.qty}
                  </Text>
                ))}
              </VStack>
              {o.comment ? (
                <Text fontSize="sm" color="textMuted" mt={2}>
                  Комментарий: {o.comment}
                </Text>
              ) : null}
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}
