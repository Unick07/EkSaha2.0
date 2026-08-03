import { useLocation } from "react-router-dom";
import { getSeoForPath } from "./metadata";
import { useSeo } from "./useSeo";

export default function RouteSeo() {
  const { pathname } = useLocation();
  const seo = getSeoForPath(pathname);
  useSeo(seo);
  return null;
}
