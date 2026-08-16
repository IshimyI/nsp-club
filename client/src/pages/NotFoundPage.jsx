import { Center, Heading, Text, Button, VStack } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import useNoIndex from "../useNoIndex";

export default function NotFoundPage() {
  useNoIndex();
  return (
    <Center py={20}>
      <VStack spacing={4} textAlign="center">
        <Heading size="xl">404</Heading>
        <Text color="textMuted">Страница не найдена</Text>
        <Button as={RouterLink} to="/">На главную</Button>
      </VStack>
    </Center>
  );
}
