import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "../components/navigation/Navbar";
import Footer from "../components/navigation/Footer";

export default function PublicLayout() {
  const location = useLocation();
  return <><Navbar /><AnimatePresence mode="wait"><motion.main key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}><Outlet /></motion.main></AnimatePresence><Footer /></>;
}
