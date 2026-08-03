/* eslint-disable react-refresh/only-export-components -- this is a build-only SSR entry, not a browser refresh boundary */
import React, { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { Route, Routes, StaticRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import BackToTop from "./components/common/BackToTop";
import { PageLoader } from "./components/common/ui";
import ErrorBoundary from "./components/feedback/ErrorBoundary";
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/public/Home";
import { About, Blog, BlogPost, Contact, NotFound, Pricing, Privacy, ServicePage, Terms } from "./pages/public";
import { createNotFoundSeo, getSeoForPath, PRERENDER_ROUTES, PRIVATE_APP_SEO } from "./seo/metadata";

export { PRERENDER_ROUTES, PRIVATE_APP_SEO };

function PublicPrerenderApp() {
  return <>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="services/:slug" element={<ServicePage />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="about" element={<About />} />
          <Route path="insights" element={<Blog />} />
          <Route path="insights/:slug" element={<BlogPost />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
    <BackToTop />
  </>;
}

export function render(pathname) {
  const appHtml = renderToString(
    <React.StrictMode>
      <ErrorBoundary>
        <StaticRouter location={pathname}>
          <PublicPrerenderApp />
          <Toaster position="top-right" />
        </StaticRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  );

  return {
    appHtml,
    seo: getSeoForPath(pathname) || createNotFoundSeo(),
  };
}
