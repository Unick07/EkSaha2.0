import { Suspense } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "../components/navigation/Navbar";
import Footer from "../components/navigation/Footer";
import { PageLoader } from "../components/common/ui";
import RouteErrorBoundary from "../components/feedback/RouteErrorBoundary";

export default function PublicLayout() {
  const location = useLocation();
  // useOutlet() (not a nested <Outlet/>) matters here: <Outlet/> is a live
  // context consumer, so once AnimatePresence starts exiting the old
  // motion.main, that still-mounted <Outlet/> keeps re-rendering against the
  // *new* route the instant the router's context updates - the "exiting"
  // page flips to the incoming page's content mid fade-out instead of
  // showing the page it's supposed to be leaving. useOutlet() resolves the
  // element once, up front, so the frozen exiting subtree has no live
  // consumer left inside it to react to the context change.
  const outlet = useOutlet();
  // mode="popLayout" (not "wait"): the entering page must never be gated on
  // the exiting page's animation finishing. Under "wait", rapid navigation
  // could interrupt an in-flight exit before its completion callback fired,
  // leaving AnimatePresence holding the next child back forever - an empty
  // <main> with no spinner, since Suspense's fallback never even got a
  // chance to mount. popLayout mounts the incoming page immediately and
  // only pulls the outgoing one out of layout flow (position: absolute)
  // while it fades, so a stuck exit can no longer block anything.
  return <><Navbar /><AnimatePresence mode="popLayout" initial={false}><motion.main key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}><RouteErrorBoundary><Suspense fallback={<PageLoader/>}>{outlet}</Suspense></RouteErrorBoundary></motion.main></AnimatePresence><Footer /></>;
}
