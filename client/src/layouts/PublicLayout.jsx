import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import Footer from "../components/navigation/Footer";
import { PageLoader } from "../components/common/ui";
import RouteErrorBoundary from "../components/feedback/RouteErrorBoundary";

export default function PublicLayout() {
  return <><Navbar /><main><RouteErrorBoundary><Suspense fallback={<PageLoader/>}><Outlet /></Suspense></RouteErrorBoundary></main><Footer /></>;
}
