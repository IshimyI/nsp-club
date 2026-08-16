import { extendTheme } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  fonts: {
    heading: `Georgia, 'Times New Roman', serif`,
    body: `'Segoe UI', system-ui, sans-serif`,
  },
  colors: {
    // Muted sage green rather than the earlier saturated grass green — same
    // hue family, lower saturation, for a softer, more understated feel.
    nsp: {
      50: "#eef6f0",
      100: "#d8e9dc",
      200: "#b8d5c0",
      300: "#93be9d",
      400: "#6ea67c",
      500: "#4f875d",
      600: "#3f6e4b",
      700: "#32583b",
      800: "#24422b",
      900: "#172c1c",
    },
    // Muted brass/bronze instead of a bright gold — quieter accent to match.
    gold: {
      50: "#f7f4ed",
      100: "#eae1d1",
      200: "#d8c8ac",
      300: "#c2ac84",
      400: "#b19668",
      500: "#9d804d",
      600: "#846a3e",
      700: "#6a542f",
    },
  },
  semanticTokens: {
    colors: {
      pageBg: { default: "gray.50", _dark: "gray.900" },
      cardBg: { default: "white", _dark: "gray.800" },
      subtleBg: { default: "gray.50", _dark: "gray.700" },
      heroBg: { default: "nsp.50", _dark: "nsp.900" },
      borderColor: { default: "gray.200", _dark: "gray.600" },
      textPrimary: { default: "gray.800", _dark: "whiteAlpha.900" },
      textMuted: { default: "gray.600", _dark: "gray.400" },
      // Chakra's stock gray.500 falls just under WCAG AA (4.5:1) for small
      // text on both white and gray.900 — bumped a step darker/lighter.
      textFaint: { default: "#65707d", _dark: "#808a9b" },
    },
  },
  styles: {
    global: {
      body: {
        bg: "pageBg",
        color: "textPrimary",
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "nsp",
      },
      variants: {
        // Chakra's stock solid/link/outline variants use shade 500 for the
        // nsp colorScheme, which is 4.05:1 / 3.86:1 against white — just
        // under WCAG AA (4.5:1). Bumped to 600 in light mode only; dark
        // mode already uses a light shade with dark text (fine as-is).
        solid: (props) =>
          props.colorScheme === "nsp"
            ? {
                bgGradient: mode("linear(135deg, nsp.500, nsp.700)", "linear(135deg, nsp.100, nsp.300)")(props),
                color: mode("white", "gray.800")(props),
                border: "none",
                _hover: {
                  bgGradient: mode("linear(135deg, nsp.600, nsp.800)", "linear(135deg, nsp.200, nsp.400)")(props),
                },
              }
            : {},
        link: (props) =>
          props.colorScheme === "nsp" ? { color: mode("nsp.600", "nsp.300")(props) } : {},
        outline: (props) =>
          props.colorScheme === "nsp" ? { color: mode("nsp.600", "nsp.300")(props) } : {},
      },
    },
  },
});

export default theme;
