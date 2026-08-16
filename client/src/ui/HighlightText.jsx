import { Text } from "@chakra-ui/react";

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function HighlightText({ text, term, ...props }) {
  if (!term?.trim()) return <Text {...props}>{text}</Text>;
  const parts = text.split(new RegExp(`(${escapeRegExp(term.trim())})`, "ig"));
  return (
    <Text {...props}>
      {parts.map((part, i) =>
        part.toLowerCase() === term.trim().toLowerCase() ? (
          <Text as="mark" key={i} bg="gold.200" color="nsp.900" px="1px" borderRadius="2px">
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}
