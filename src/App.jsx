import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ReadingProgress from './components/ReadingProgress'
import BackToTop from './components/BackToTop'
import ReadingRuler from './components/ReadingRuler'

// Pages are code-split so the heavy, route-specific deps (react-markdown +
// highlight.js on a post, mermaid for diagrams, d3 for the graph) only download
// when that route is actually visited — keeping first paint fast.
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Tools = lazy(() => import('./pages/Tools'))
const Glossary = lazy(() => import('./pages/Glossary'))
const Graph = lazy(() => import('./pages/Graph'))
const Snippets = lazy(() => import('./pages/Snippets'))
const WarStories = lazy(() => import('./pages/WarStories'))
const StartHere = lazy(() => import('./pages/StartHere'))
const CtfEvents = lazy(() => import('./pages/CtfEvents'))
const KevBoard = lazy(() => import('./pages/KevBoard'))
const Cves = lazy(() => import('./pages/Cves'))
const Ransomware = lazy(() => import('./pages/Ransomware'))
const ZeroDays = lazy(() => import('./pages/ZeroDays'))
const Toolbox = lazy(() => import('./pages/Toolbox'))
const Saved = lazy(() => import('./pages/Saved'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  const location = useLocation()

  return (
    <div className="app">
      <ReadingProgress />
      <ScrollToTop />
      <Navbar />
      <main className="main">
        {/* keyed by pathname so the fade-in animation replays on each navigation */}
        <div className="route-fade" key={location.pathname}>
          <Suspense fallback={<div className="route-loading" aria-hidden="true" />}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/glossary" element={<Glossary />} />
              <Route path="/graph" element={<Graph />} />
              <Route path="/snippets" element={<Snippets />} />
              <Route path="/war-stories" element={<WarStories />} />
              <Route path="/start-here" element={<StartHere />} />
              <Route path="/ctf" element={<CtfEvents />} />
              <Route path="/kev" element={<KevBoard />} />
              <Route path="/cves" element={<Cves />} />
              <Route path="/ransomware" element={<Ransomware />} />
              <Route path="/0day" element={<ZeroDays />} />
              <Route path="/toolbox" element={<Toolbox />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      <Footer />
      <BackToTop />
      <ReadingRuler />
    </div>
  )
}
