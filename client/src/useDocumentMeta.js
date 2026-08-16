import { useEffect } from "react";

const DEFAULT_TITLE = "NSP Club — БАД и продукция Nature's Sunshine (NSP)";
const DEFAULT_DESCRIPTION =
  "Каталог БАД, витаминов и продукции Nature's Sunshine (NSP) с подробными описаниями, составом и применением. Оформите заявку на заказ онлайн.";

export default function useDocumentMeta(title, description) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description || DEFAULT_DESCRIPTION);
    return () => {
      document.title = DEFAULT_TITLE;
      if (meta) meta.setAttribute("content", DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
