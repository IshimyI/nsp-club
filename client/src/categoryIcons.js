import Pill from "lucide-react/dist/esm/icons/pill";
import Droplets from "lucide-react/dist/esm/icons/droplets";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Gift from "lucide-react/dist/esm/icons/gift";
import Leaf from "lucide-react/dist/esm/icons/leaf";

const ICONS = {
  БАД: Pill,
  "Уход и гигиена": Droplets,
  "Уход за кожей (Bremani Care)": Sparkles,
  Наборы: Gift,
};

export default function categoryIcon(category) {
  return ICONS[category] || Leaf;
}
