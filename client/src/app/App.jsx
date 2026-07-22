import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AppShell from "../layouts/AppShell";
import { PageLoader } from "../components/common/ui";
import BackToTop from "../components/common/BackToTop";
import { useAppStore } from "../store/useAppStore";

const Home = lazy(() => import("../pages/public/Home"));
const from = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));
const publicPages = () => import("../pages/public");
const authPages = () => import("../pages/auth");
const dashboardPages = () => import("../pages/dashboard");
const adminPages = () => import("../pages/admin");
const ServicePage = from(publicPages, "ServicePage");
const Pricing = from(publicPages, "Pricing");
const About = from(publicPages, "About");
const Blog = from(publicPages, "Blog");
const BlogPost = from(publicPages, "BlogPost");
const Contact = from(publicPages, "Contact");
const NotFound = from(publicPages, "NotFound");
const Login = from(authPages, "Login");
const Signup = from(authPages, "Signup");
const ForgotPassword = from(authPages, "ForgotPassword");
const ResetPassword = from(authPages, "ResetPassword");
const Callback = lazy(() => import("../pages/auth/Callback"));
const VerifyEmail = lazy(() => import("../pages/auth/VerifyEmail"));
const Overview = from(dashboardPages, "Overview");
const MyServices = from(dashboardPages, "MyServices");
const Tickets = from(dashboardPages, "Tickets");
const Invoices = from(dashboardPages, "Invoices");
const AccountSettings = from(dashboardPages, "AccountSettings");
const AdminOverview = from(adminPages, "AdminOverview");
const AdminUsers = from(adminPages, "AdminUsers");
const AdminUsersReadOnly = from(adminPages, "AdminUsersReadOnly");
const AdminSubscriptions = from(adminPages, "AdminSubscriptions");
const AdminTickets = from(adminPages, "AdminTickets");
const AdminTeam = from(adminPages, "AdminTeam");
const AdminAnalytics = from(adminPages, "AdminAnalytics");
const AdminInvoices = from(adminPages, "AdminInvoices");
const ResourceManager = from(adminPages, "ResourceManager");
const AdminSettings = from(adminPages, "AdminSettings");

export default function App() {
  const restoreSession = useAppStore((state) => state.restoreSession);
  const theme = useAppStore((state) => state.theme);
  const themePreference = useAppStore((state) => state.themePreference);
  const syncThemeWithSystem = useAppStore((state) => state.syncThemeWithSystem);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (themePreference !== "system") return undefined;

    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemTheme = (event) => syncThemeWithSystem(event.matches ? "dark" : "light");

    applySystemTheme(colorScheme);
    colorScheme.addEventListener("change", applySystemTheme);
    return () => colorScheme.removeEventListener("change", applySystemTheme);
  }, [syncThemeWithSystem, themePreference]);

  // The favicon always follows the browser/device color scheme, independent
  // of a manual in-app theme override, so it stays legible in the browser UI.
  useEffect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemFavicon = (event) => {
      document.getElementById("app-favicon")?.setAttribute(
        "href",
        event.matches ? "/brand/eksaha-icon-white.svg" : "/brand/eksaha-icon.svg",
      );
    };

    applySystemFavicon(colorScheme);
    colorScheme.addEventListener("change", applySystemFavicon);
    return () => colorScheme.removeEventListener("change", applySystemFavicon);
  }, []);

  // Keep the page and browser chrome in sync on every route,
  // including dashboard/admin pages that never mount the public Navbar.
  useEffect(() => {
    const darkMode = theme === "dark";
    const themeColor = document.querySelector('meta[name="theme-color"]');

    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
    themeColor?.setAttribute("content", darkMode ? "#111827" : "#F6FAF9");
  }, [theme]);

  return <><Suspense fallback={<PageLoader/>}><Routes>
    <Route element={<PublicLayout/>}>
      <Route index element={<Home/>}/>
      <Route path="services/:slug" element={<ServicePage/>}/>
      <Route path="pricing" element={<Pricing/>}/>
      <Route path="about" element={<About/>}/>
      <Route path="insights" element={<Blog/>}/>
      <Route path="insights/:slug" element={<BlogPost/>}/>
      <Route path="blog" element={<Blog/>}/>
      <Route path="blog/:slug" element={<BlogPost/>}/>
      <Route path="contact" element={<Contact/>}/>
      <Route path="*" element={<NotFound/>}/>
    </Route>
    <Route path="/login" element={<Login/>}/>
    <Route path="/signup" element={<Signup/>}/>
    <Route path="/forgot-password" element={<ForgotPassword/>}/>
    <Route path="/reset-password/:token" element={<ResetPassword/>}/>
    <Route path="/auth/callback" element={<Callback/>}/>
    <Route path="/verify-email" element={<VerifyEmail/>}/>
    <Route path="/dashboard" element={<AppShell variant="user"/>}>
      <Route index element={<Overview/>}/>
      <Route path="services" element={<MyServices/>}/>
      <Route path="tickets" element={<Tickets/>}/>
      <Route path="invoices" element={<Invoices/>}/>
      <Route path="settings" element={<AccountSettings/>}/>
    </Route>
    <Route path="/admin" element={<AppShell variant="admin"/>}>
      <Route index element={<AdminOverview/>}/>
      <Route path="users" element={<AdminUsers/>}/>
      <Route path="subscriptions" element={<AdminSubscriptions/>}/>
      <Route path="services" element={<ResourceManager type="Services"/>}/>
      <Route path="tickets" element={<AdminTickets/>}/>
      <Route path="team" element={<AdminTeam/>}/>
      <Route path="blog" element={<ResourceManager type="Blog"/>}/>
      <Route path="invoices" element={<AdminInvoices/>}/>
      <Route path="analytics" element={<AdminAnalytics/>}/>
      <Route path="settings" element={<AdminSettings/>}/>
    </Route>
    <Route path="/support" element={<AppShell variant="support"/>}>
      <Route index element={<Navigate to="/support/users" replace/>}/>
      <Route path="users" element={<AdminUsers/>}/>
      <Route path="services" element={<ResourceManager type="Services"/>}/>
      <Route path="tickets" element={<AdminTickets/>}/>
      <Route path="blog" element={<ResourceManager type="Blog"/>}/>
      <Route path="settings" element={<AccountSettings/>}/>
    </Route>
    <Route path="/billing" element={<AppShell variant="billing"/>}>
      <Route index element={<Navigate to="/billing/subscriptions" replace/>}/>
      <Route path="subscriptions" element={<AdminSubscriptions/>}/>
      <Route path="services" element={<ResourceManager type="Services"/>}/>
      <Route path="invoices" element={<AdminInvoices/>}/>
      <Route path="tickets" element={<AdminTickets/>}/>
      <Route path="users" element={<AdminUsersReadOnly/>}/>
      <Route path="settings" element={<AccountSettings/>}/>
    </Route>
  </Routes></Suspense><BackToTop/></>;
}
