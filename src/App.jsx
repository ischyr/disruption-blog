import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ReadingProgress from './components/ReadingProgress'
import BackToTop from './components/BackToTop'
import ReadingRuler from './components/ReadingRuler'
import Home from './pages/Home'
import About from './pages/About'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Tools from './pages/Tools'
import Videos from './pages/Videos'
import Glossary from './pages/Glossary'
import Graph from './pages/Graph'
import Snippets from './pages/Snippets'
import WarStories from './pages/WarStories'
import StartHere from './pages/StartHere'
import CtfEvents from './pages/CtfEvents'
import KevBoard from './pages/KevBoard'
import Cves from './pages/Cves'
import Toolbox from './pages/Toolbox'
import Saved from './pages/Saved'
import NotFound from './pages/NotFound'

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
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="/snippets" element={<Snippets />} />
            <Route path="/war-stories" element={<WarStories />} />
            <Route path="/start-here" element={<StartHere />} />
            <Route path="/ctf" element={<CtfEvents />} />
            <Route path="/kev" element={<KevBoard />} />
            <Route path="/cves" element={<Cves />} />
            <Route path="/toolbox" element={<Toolbox />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <Footer />
      <BackToTop />
      <ReadingRuler />
    </div>
  )
}
