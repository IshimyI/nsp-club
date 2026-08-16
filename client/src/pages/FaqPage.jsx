import {
  Box,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
} from "@chakra-ui/react";
import useDocumentMeta from "../useDocumentMeta";
import useJsonLd from "../useJsonLd";

const FAQ = [
  {
    q: "Как сделать заказ?",
    a: "Добавьте нужные товары в заявку кнопкой «В заявку», перейдите в корзину, укажите имя и телефон и отправьте. Мы свяжемся с вами, чтобы подтвердить наличие и итоговую цену.",
  },
  {
    q: "Продукция оригинальная?",
    a: "Да, мы работаем как официальный дистрибьютор Nature's Sunshine Products (NSP).",
  },
  {
    q: "Что такое «цена по дисконтной карте»?",
    a: "Это цена для держателей дисконтной карты постоянного покупателя NSP. Карта оформляется бесплатно через дистрибьютора — поможем оформить при первом заказе.",
  },
  {
    q: "Как быстро вы отвечаете на заявку?",
    a: "Обычно связываемся в течение рабочего дня после получения заявки.",
  },
  {
    q: "В какой валюте указаны цены?",
    a: "На сайте цены показаны в долларах (так исторически принято у NSP), оплата — в рублях по курсу на день заказа. Итоговую сумму в рублях мы называем при подтверждении заявки.",
  },
  {
    q: "Можно ли вернуть товар?",
    a: "БАД относится к товарам, которые по закону нельзя вернуть или обменять, если они надлежащего качества (не бракованные). Если пришёл повреждённый или не соответствующий заказу товар — решим вопрос с заменой или возвратом средств.",
  },
];

export default function FaqPage() {
  useDocumentMeta("Вопросы и ответы — NSP Club", "Частые вопросы о заказе, оплате и продукции NSP.");
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  });
  return (
    <Box maxW="700px">
      <Heading size="lg" mb={5}>Вопросы и ответы</Heading>
      <Accordion allowToggle>
        {FAQ.map((item) => (
          <AccordionItem key={item.q}>
            <h2>
              <AccordionButton>
                <Text flex="1" textAlign="left" fontWeight="600">{item.q}</Text>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel color="textMuted">{item.a}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
}
