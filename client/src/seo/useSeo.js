import { useEffect } from "react";
import { applySeo } from "./dom";

export function useSeo(seo) {
  useEffect(() => {
    applySeo(seo);
  }, [seo]);
}
