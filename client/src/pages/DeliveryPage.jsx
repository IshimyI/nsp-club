import { Box, Heading, Text, VStack, Divider } from "@chakra-ui/react";
import useDocumentMeta from "../useDocumentMeta";

export default function DeliveryPage() {
  useDocumentMeta(
    "Доставка и оплата — NSP Club",
    "Как оформить заказ, способы доставки и оплаты продукции NSP."
  );
  return (
    <Box maxW="700px">
      <Heading size="lg" mb={5}>Доставка и оплата</Heading>
      <VStack align="start" spacing={4} color="textMuted">
        <Text>
          Заказ оформляется через заявку на сайте: вы выбираете товары, указываете
          имя и телефон, мы связываемся с вами для подтверждения наличия, итоговой
          стоимости в рублях и деталей доставки.
        </Text>

        <Divider />

        <Heading size="sm">Доставка</Heading>
        <Text>
          Конкретный способ и стоимость доставки зависят от региона и объёма
          заказа — уточняются индивидуально при подтверждении заявки.
        </Text>

        <Heading size="sm">Оплата</Heading>
        <Text>
          Способ оплаты согласовывается при подтверждении заказа, после того как
          названа итоговая цена в рублях по актуальному курсу.
        </Text>

        <Divider />

        <Text fontSize="sm" color="textFaint">
          Продукция не является лекарственным средством.
        </Text>
      </VStack>
    </Box>
  );
}
