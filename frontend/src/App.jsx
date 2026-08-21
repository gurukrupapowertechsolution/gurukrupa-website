import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./Homepage";
import RemainingPages from "./RemainingPages";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsAndConditions from "./TermsAndConditions";
import ScrollToTop from "./components/ScrollToTop";
import QuoteFlowSentinel from "./components/QuoteFlowSentinel";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import ProjectsGallery from "./pages/ProjectsGallery";
import RoiCalculator from "./pages/RoiCalculator";
import Faq from "./pages/Faq";
import About from "./pages/About";
import WhySolar from "./pages/WhySolar";

export default function App() {
  return (
    <BrowserRouter>
      {/* The blue trailing ring that used to render here (CustomCursor) is gone.
          A second cursor chasing the real one is a novelty that costs a rAF on
          every pointer move and reads as lag on the OS cursor it duplicates. */}
      <ScrollToTop />
      {/* Tracks whether the visitor is still inside the quotation journey. Must
          sit here rather than in the two flow pages: it fires on the routes
          where neither of them is mounted, which is exactly when the session
          needs parking. */}
      <QuoteFlowSentinel />
      {/* `page-scale` (93%) is applied to the three chrome/content blocks rather
          than to this wrapper. Putting it on an ancestor of the fixed header
          would make the header's containing block a zoomed box, which is the one
          place `zoom` and `position: fixed` interact badly; zooming the fixed
          element itself is well-defined. The homepage hero opts back out — see
          the reciprocal pair in index.css. */}
      <div className="flex flex-col min-h-screen w-full">
        <Header />
        <main className="page-scale flex-1 w-full">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/quote" element={<RemainingPages />} />
            {/* Task C — Legal pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            {/* Phase 2 Pages */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/projects" element={<ProjectsGallery />} />
            {/* Phase 4 — dedicated EMI / ROI lead-nurturing tool */}
            <Route path="/roi-calculator" element={<RoiCalculator />} />
            {/* Phase 3 — searchable FAQ knowledge base */}
            <Route path="/faq" element={<Faq />} />
            {/* Phase 2 (round 2) — the two narrative sections lifted out of the
                homepage scroll. /about merges what were the AboutUs and
                WhyGurukrupa components; /why-solar expands what was WhySolar. */}
            <Route path="/about" element={<About />} />
            <Route path="/why-solar" element={<WhySolar />} />
          </Routes>
        </main>
        <div className="page-scale">
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}
