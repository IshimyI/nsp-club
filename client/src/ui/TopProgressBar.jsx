import { Box } from "@chakra-ui/react";

export default function TopProgressBar() {
  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      h="3px"
      zIndex="200"
      overflow="hidden"
      bg="nsp.200"
    >
      <Box
        h="100%"
        w="40%"
        bg="gold.500"
        sx={{
          animation: "nsp-progress 1s ease-in-out infinite",
          "@keyframes nsp-progress": {
            "0%": { transform: "translateX(-100%)" },
            "100%": { transform: "translateX(350%)" },
          },
        }}
      />
    </Box>
  );
}
