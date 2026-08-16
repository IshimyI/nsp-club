import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import NavBar from "./ui/NavBar";
import Footer from "./ui/Footer";
import BackToTop from "./ui/BackToTop";
import CompareBar from "./ui/CompareBar";
import TopProgressBar from "./ui/TopProgressBar";
import ErrorBoundary from "./ui/ErrorBoundary";
import CookieConsent from "./ui/CookieConsent";
import FloatingChatButton from "./ui/FloatingChatButton";
import useCanonical from "./useCanonical";

const HomePage = lazy(() => import("./pages/HomePage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const DeliveryPage = lazy(() => import("./pages/DeliveryPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const ReturnsPage = lazy(() => import("./pages/ReturnsPage"));
const HowToReadLabelPage = lazy(() => import("./pages/HowToReadLabelPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const MotionBox = motion(Box);

function AnimatedRoutes() {
  const location = useLocation();
  useCanonical(location.pathname);
  return (
    <AnimatePresence mode="wait">
      <MotionBox
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/how-to-read-label" element={<HowToReadLabelPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MotionBox>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Box display="flex" flexDirection="column" minH="100vh">
      <Box
        as="a"
        href="#main-content"
        position="absolute"
        left="-9999px"
        top="0"
        zIndex="300"
        bg="nsp.700"
        color="white"
        px={4}
        py={2}
        borderRadius="md"
        _focus={{ left: "8px", top: "8px" }}
      >
        Перейти к содержимому
      </Box>
      <CookieConsent />
      <NavBar />
      <Box as="main" id="main-content" flex="1" w="100%" maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={8}>
        <ErrorBoundary>
          <Suspense fallback={<TopProgressBar />}>
            <AnimatedRoutes />
          </Suspense>
        </ErrorBoundary>
      </Box>
      <Footer />
      <BackToTop />
      <CompareBar />
      <FloatingChatButton />
    </Box>
  );
}
