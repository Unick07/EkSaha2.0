import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "../components/navigation/Navbar";
import Footer from "../components/navigation/Footer";
import { PageLoader } from "../components/common/ui";
import RouteErrorBoundary from "../components/feedback/RouteErrorBoundary";

export default function PublicLayout() {
  const location = useLocation();
  return <><Navbar /><AnimatePresence mode="wait" initial={false}><motion.main key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}><RouteErrorBoundary><Suspense fallback={<PageLoader/>}><Outlet /></Suspense></RouteErrorBoundary></motion.main></AnimatePresence><Footer /></>;
}
