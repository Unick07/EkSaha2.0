import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import Footer from "../components/navigation/Footer";
import { PageLoader } from "../components/common/ui";
import RouteErrorBoundary from "../components/feedback/RouteErrorBoundary";

export default function PublicLayout() {
  const location = useLocation();
  return <><Navbar /><AnimatePresence mode="wait"><motion.main key={location.pathname} initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}><Outlet /></motion.main></AnimatePresence><Footer /></>;
  return <><Navbar /><main><RouteErrorBoundary><Suspense fallback={<PageLoader/>}><Outlet /></Suspense></RouteErrorBoundary></main><Footer /></>;
}
