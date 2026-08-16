import { Component } from "react";
import { Center, Heading, Text, Button, VStack } from "@chakra-ui/react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center py={20}>
          <VStack spacing={4} textAlign="center">
            <Heading size="lg">Что-то пошло не так</Heading>
            <Text color="textMuted">Попробуйте обновить страницу.</Text>
            <Button onClick={() => window.location.assign("/")}>На главную</Button>
          </VStack>
        </Center>
      );
    }
    return this.props.children;
  }
}
