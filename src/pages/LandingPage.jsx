// src/pages/LandingPage.jsx
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Banknote,
  BarChart3,
  BellRing,
  CheckCircle2,
  Clock,
  Globe,
  Layers,
  Lock,
  MessageSquare,
  Moon,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
  Wallet,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const cls = (...x) => x.filter(Boolean).join(" ");

/* ---------------------------- helpers ---------------------------- */

/** smooth count-up hook */
function useCountUp(target = 0, duration = 1200) {
  const [val, setVal] = useState(0);
  const frame = useRef();
  const startTs = useRef();

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    startTs.current = undefined;

    const animate = (ts) => {
      if (!startTs.current) startTs.current = ts;
      const p = Math.min((ts - startTs.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(Math.floor(eased * target));
      if (p < 1) frame.current = requestAnimationFrame(animate);
    };

    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return val;
}

/** theme toggle w/ persistence */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  return [theme, setTheme];
}

/** scroll spy for active section */
function useScrollSpy(ids = []) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids]);

  return active;
}

/** small parallax util (returns style transform) */
function useParallax(multiplier = 0.2) {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY * multiplier);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [multiplier]);
  return { transform: `translate3d(0, ${y}px, 0)` };
}

/* ---------------------------- main page ---------------------------- */

export default function LandingPage() {
  const [theme, setTheme] = useTheme();
  const active = useScrollSpy(["features", "pricing", "security", "testimonials", "chatbot", "faq"]);
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // parallax layers
  const parallax1 = useParallax(0.08);
  const parallax2 = useParallax(0.12);
  const parallax3 = useParallax(0.06);
  const parallax4 = useParallax(0.14);

  // shimmer animation flag (on first mount)
  const [shimmerOn, setShimmerOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShimmerOn(false), 2400);
    return () => clearTimeout(t);
  }, []);

  // floating coins configuration (positions & delays)
  const coins = useMemo(
    () => [
      { top: "12%", left: "8%", size: 64, delay: 0 },
      { top: "22%", right: "10%", size: 42, delay: 0.2 },
      { top: "64%", left: "6%", size: 54, delay: 0.35 },
      { top: "70%", right: "8%", size: 70, delay: 0.5 },
      { top: "36%", left: "50%", size: 40, delay: 0.15 },
      { top: "18%", right: "28%", size: 36, delay: 0.45 },
      { top: "50%", right: "20%", size: 48, delay: 0.25 },
    ],
    []
  );
  
  // Chat bot messages
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi there! How can I help you with CreditJambo today?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: inputValue }]);
    
    // Simulate assistant response
    setTimeout(() => {
      let response;
      const query = inputValue.toLowerCase();
      
      if (query.includes("pricing") || query.includes("cost")) {
        response = "CreditJambo offers a free Starter plan, a Pro plan at $4/month with device verification and push notifications, and a Business plan at $12/month with team accounts and advanced analytics.";
      } else if (query.includes("security")) {
        response = "Security is our priority! We use encrypted tokens, role-based access, admin approvals, and comprehensive audit trails to keep your data safe.";
      } else if (query.includes("feature") || query.includes("offer")) {
        response = "CreditJambo offers instant deposits, smart insights, real-time alerts, device verification, OTP password reset, and much more! Check out our Features section for details.";
      } else {
        response = "Thanks for your interest in CreditJambo! You can create a free account to get started, or explore our features and pricing plans on this page.";
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    }, 800);
    
    // Clear input
    setInputValue("");
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white scroll-smooth">
      {/* Ambient/parallax gradient orbs with enhanced colors */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-28 -left-24 h-[32rem] w-[32rem] rounded-full bg-emerald-500/15 blur-[100px]"
          style={parallax1}
        />
        <div
          className="absolute top-52 -right-28 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[80px]"
          style={parallax2}
        />
        <div
          className="absolute bottom-[-8rem] left-[25%] h-96 w-96 rounded-full bg-indigo-500/10 blur-[90px]"
          style={parallax3}
        />
        <div
          className="absolute top-[65%] right-[15%] h-[24rem] w-[24rem] rounded-full bg-violet-500/10 blur-[80px]"
          style={parallax4}
        />
      </div>

      {/* Floating 3D coins with enhanced effect */}
      <CoinField coins={coins} />

      {/* Nav with improved mobile menu */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="group flex items-center gap-3 z-20">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur">
              <Wallet className="h-6 w-6 text-emerald-300 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-xl font-black tracking-tight text-transparent">
              CreditJambo
            </span>
          </Link>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden z-20 p-2 text-white"
            aria-label="Toggle menu"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <span className={`block h-0.5 w-full bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block h-0.5 w-full bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`block h-0.5 w-full bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <a
              href="#features"
              className={cls(
                "text-sm transition-colors hover:text-white relative",
                active === "features" ? "text-white" : "text-gray-300"
              )}
            >
              Features
              {active === "features" && (
                <motion.span 
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                ></motion.span>
              )}
            </a>
            <a
              href="#pricing"
              className={cls(
                "text-sm transition-colors hover:text-white relative",
                active === "pricing" ? "text-white" : "text-gray-300"
              )}
            >
              Pricing
              {active === "pricing" && (
                <motion.span 
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                ></motion.span>
              )}
            </a>
            <a
              href="#security"
              className={cls(
                "text-sm transition-colors hover:text-white relative",
                active === "security" ? "text-white" : "text-gray-300"
              )}
            >
              Security
              {active === "security" && (
                <motion.span 
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                ></motion.span>
              )}
            </a>
            <a
              href="#testimonials"
              className={cls(
                "text-sm transition-colors hover:text-white relative",
                active === "testimonials" ? "text-white" : "text-gray-300"
              )}
            >
              Testimonials
              {active === "testimonials" && (
                <motion.span 
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                ></motion.span>
              )}
            </a>
            <a
              href="#faq"
              className={cls(
                "text-sm transition-colors hover:text-white relative",
                active === "faq" ? "text-white" : "text-gray-300"
              )}
            >
              FAQ
              {active === "faq" && (
                <motion.span 
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                ></motion.span>
              )}
            </a>
          </nav>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl z-10 pt-20 pb-6 border-b border-white/10"
              >
                <nav className="flex flex-col items-center gap-4">
                  <a
                    href="#features"
                    onClick={() => setMenuOpen(false)}
                    className={cls(
                      "text-sm py-2 transition-colors w-full text-center",
                      active === "features" ? "text-white bg-white/5" : "text-gray-300"
                    )}
                  >
                    Features
                  </a>
                  <a
                    href="#pricing"
                    onClick={() => setMenuOpen(false)}
                    className={cls(
                      "text-sm py-2 transition-colors w-full text-center",
                      active === "pricing" ? "text-white bg-white/5" : "text-gray-300"
                    )}
                  >
                    Pricing
                  </a>
                  <a
                    href="#security"
                    onClick={() => setMenuOpen(false)}
                    className={cls(
                      "text-sm py-2 transition-colors w-full text-center",
                      active === "security" ? "text-white bg-white/5" : "text-gray-300"
                    )}
                  >
                    Security
                  </a>
                  <a
                    href="#testimonials"
                    onClick={() => setMenuOpen(false)}
                    className={cls(
                      "text-sm py-2 transition-colors w-full text-center",
                      active === "testimonials" ? "text-white bg-white/5" : "text-gray-300"
                    )}
                  >
                    Testimonials
                  </a>
                  <a
                    href="#faq"
                    onClick={() => setMenuOpen(false)}
                    className={cls(
                      "text-sm py-2 transition-colors w-full text-center",
                      active === "faq" ? "text-white bg-white/5" : "text-gray-300"
                    )}
                  >
                    FAQ
                  </a>
                  <div className="flex flex-col w-full gap-2 mt-2 px-4">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-gray-200 text-center"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-2.5 text-sm font-semibold"
                    >
                      Get started <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="hidden md:flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-1 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-gray-200 hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold shadow-[0_10px_30px_-12px_rgba(16,185,129,0.45)] hover:shadow-[0_15px_35px_-12px_rgba(16,185,129,0.55)] transition-all"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Chat Bubble */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 p-4 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105"
        aria-label="Open Chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Chat Modal */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-40 w-[350px] md:w-[400px] rounded-xl border border-white/10 bg-gray-900 shadow-xl overflow-hidden"
          >
            <div className="border-b border-white/10 bg-gradient-to-r from-emerald-500 to-cyan-500 p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span className="font-semibold text-sm">CreditJambo Assistant</span>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="rounded-full p-1 hover:bg-black/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="h-[350px] overflow-y-auto p-4 flex flex-col gap-3 bg-gray-900">
              {messages.map((message, i) => (
                <div 
                  key={i}
                  className={`${message.role === 'assistant' ? 'self-start' : 'self-end'} max-w-[85%]`}
                >
                  <div 
                    className={`p-3 rounded-2xl ${
                      message.role === 'assistant' 
                        ? 'bg-white/10 text-white' 
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} className="border-t border-white/10 p-3 flex gap-2">
              <input
                type="text"
                placeholder="Ask about CreditJambo..."
                className="flex-1 bg-white/5 rounded-lg border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button 
                type="submit" 
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3"
              >
                <ArrowUpRight className="h-5 w-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero — full screen with enhanced visuals */}
      <section className="relative z-10 mx-auto flex h-screen max-w-7xl flex-col justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            The smarter way to save & grow
          </div>

          {/* Shimmer headline with improved animation */}
          <h1
            className={cls(
              "text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl",
              "bg-clip-text text-transparent",
              shimmerOn
                ? "animate-shimmer bg-[linear-gradient(110deg,#fff,45%,#9ca3af,55%,#fff)] bg-[length:250%_100%]"
                : "bg-gradient-to-br from-white via-white to-gray-300"
            )}
          >
            Save. Withdraw. Grow.
            <br className="hidden md:block" />
            All in one sleek app.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-gray-300">
            CreditJambo helps you automate savings, track insights, and stay secure with device
            verification, OTP resets, and real-time alerts — built for Africa's next billion.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3.5 text-sm font-semibold shadow-[0_10px_25px_-12px_rgba(16,185,129,0.45)] hover:shadow-[0_15px_30px_-12px_rgba(16,185,129,0.55)] transition-all duration-300"
            >
              Create free account
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm text-gray-200 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
            >
              Learn more
            </a>
          </div>

          {/* Premium Stat counters with enhanced design */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat title="Active Users" value={15000} suffix="+" icon={<Users className="h-4 w-4 text-emerald-300" />} />
            <Stat title="Avg. APY (promo)" value={4.5} fixed={1} suffix="%" icon={<TrendingUp className="h-4 w-4 text-cyan-300" />} />
            <Stat title="Countries" value={7} suffix="+" icon={<Globe className="h-4 w-4 text-indigo-300" />} />
            <Stat title="Uptime" value={99.99} fixed={2} suffix="%" icon={<Zap className="h-4 w-4 text-amber-300" />} />
          </div>
        </motion.div>

        {/* Showcase card with enhanced design */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-12 w-full max-w-5xl lg:mt-20"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-2xl" />
            <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-2xl" />
            
            {/* Top badge */}
            <div className="mb-4 mx-auto w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 backdrop-blur-sm">
              Designed for simplicity, built for performance
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <ShowcaseTile
                icon={<Banknote className="h-5 w-5 text-emerald-300" />}
                title="Instant Deposits"
                text="Top up in seconds and track balance after each transaction."
                delay={0.1}
              />
              <ShowcaseTile
                icon={<BarChart3 className="h-5 w-5 text-cyan-300" />}
                title="Smart Insights"
                text="See trends over 30 days and discover your saving rhythm."
                delay={0.2}
              />
              <ShowcaseTile
                icon={<BellRing className="h-5 w-5 text-indigo-300" />}
                title="Real-time Alerts"
                text="Low balance warnings, deposit confirmations & more."
                delay={0.3}
              />
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm text-gray-400">
              What you saw in the Admin Dashboard? This is the companion experience for users —
              fast, secure, and delightful.
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features with enhanced card design and animations */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24 scroll-mt-20">
        <div className="mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-block bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-3xl font-black text-transparent md:text-4xl"
          >
            Powerful features, minimal effort
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-2xl text-gray-300"
          >
            Everything you need to manage your finances efficiently, with advanced security and user-friendly controls.
          </motion.p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
            title="Device Verification"
            text="Approve or reject login devices for extra protection with geo-location awareness and device recognition technology."
            delay={0.1}
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5 text-cyan-300" />}
            title="OTP Password Reset"
            text="Regain access with secure one-time codes via email or SMS, with expiring tokens and rate limiting for enhanced security."
            delay={0.2}
          />
          <FeatureCard
            icon={<Smartphone className="h-5 w-5 text-indigo-300" />}
            title="Push Notifications"
            text="Stay up to date on deposits, withdrawals & low-balance events with customizable alerts through our mobile app."
            delay={0.3}
          />
          <FeatureCard
            icon={<Users className="h-5 w-5 text-emerald-300" />}
            title="Admin Controls"
            text="Admins manage users, roles, balances & login activity with detailed audit logs and permission management."
            delay={0.4}
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5 text-cyan-300" />}
            title="Advanced Analytics"
            text="Monitor performance with beautiful charts, identify trends, and see top savers at a glance with exportable reports."
            delay={0.5}
          />
          <FeatureCard
            icon={<MessageSquare className="h-5 w-5 text-indigo-300" />}
            title="Live Chat Support"
            text="Get instant help from our support team through the in-app chat interface available 24/7 for all account tiers."
            delay={0.6}
          />
          <FeatureCard
            icon={<Layers className="h-5 w-5 text-emerald-300" />}
            title="Multi-currency Support"
            text="Manage savings in multiple currencies with real-time conversion rates and seamless exchange functionality."
            delay={0.7}
          />
          <FeatureCard
            icon={<Clock className="h-5 w-5 text-cyan-300" />}
            title="Scheduled Transfers"
            text="Set up recurring deposits or withdrawals with custom schedules to automate your savings strategy."
            delay={0.8}
          />
          <FeatureCard
            icon={<Award className="h-5 w-5 text-indigo-300" />}
            title="Rewards Program"
            text="Earn points for consistent savings behavior and redeem for bonuses, higher interest rates, or partner perks."
            delay={0.9}
          />
        </div>
      </section>

      {/* Pricing with enhanced cards and feature lists */}
      <section id="pricing" className="relative z-10 mx-auto max-w-7xl px-6 py-24 scroll-mt-20">
        <div className="mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-block bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-3xl font-black text-transparent md:text-4xl"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-2xl text-gray-300"
          >
            Choose the perfect plan for your needs with no hidden fees or complicated structures.
          </motion.p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Plan
            badge="Starter"
            price="Free"
            description="Perfect for individuals just starting their savings journey"
            items={[
              "Basic savings account",
              "Email notifications",
              "OTP password reset",
              "Balance tracking",
              "Community support",
              "Mobile app access",
              "Up to $1,000 monthly deposits"
            ]}
            cta="Get started"
            to="/register"
            delay={0.1}
          />
          <Plan
            badge="Pro"
            price="$4/mo"
            description="For those who want enhanced security and features"
            emphasized
            items={[
              "Everything in Starter",
              "Device verification",
              "Push notifications",
              "Advanced analytics",
              "Multi-currency accounts",
              "Priority support",
              "Up to $5,000 monthly deposits",
              "Scheduled transfers"
            ]}
            cta="Upgrade now"
            to="/register"
            delay={0.2}
          />
          <Plan
            badge="Business"
            price="$12/mo"
            description="Comprehensive features for teams and companies"
            items={[
              "Everything in Pro",
              "Team accounts (5 users)",
              "Role-based permissions",
              "Admin dashboard",
              "Custom alerts",
              "API access",
              "Unlimited monthly deposits",
              "Dedicated account manager",
              "Custom reporting",
              "SLA support"
            ]}
            cta="Contact sales"
            to="/register"
            delay={0.3}
          />
        </div>
      </section>

      {/* Security / CTA with enhanced design */}
      <section id="security" className="relative z-10 mx-auto max-w-7xl px-6 py-24 scroll-mt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl"
        >
          <div className="grid gap-6 md:grid-cols-2 p-8 relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <h3 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-2xl font-black text-transparent md:text-3xl">
                Security baked in
              </h3>
              <p className="mt-4 text-gray-300">
                From OTP resets to device approvals, we designed every flow to protect your funds
                without slowing you down. Our enterprise-grade security measures ensure your data
                and finances are always protected.
              </p>
              
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-gray-200">
                <SecurityFeature icon={<Lock className="h-4 w-4" />} text="Encrypted tokens" />
                <SecurityFeature icon={<Users className="h-4 w-4" />} text="Role-based access" />
                <SecurityFeature icon={<ShieldCheck className="h-4 w-4" />} text="Admin approvals" />
                <SecurityFeature icon={<Clock className="h-4 w-4" />} text="Audit trails" />
                <SecurityFeature icon={<Smartphone className="h-4 w-4" />} text="Device fingerprinting" />
                <SecurityFeature icon={<Globe className="h-4 w-4" />} text="Geo-fencing" />
              </div>
              
              {/* Security badges */}
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-sm flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  ISO 27001 Certified
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-sm flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-cyan-300" />
                  PCI DSS Compliant
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-sm flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-300" />
                  GDPR Ready
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
                <h4 className="mb-4 text-lg font-semibold text-white">Ready for enterprise-grade security?</h4>
                <p className="text-gray-300 mb-6">
                  Experience seamless savings with the highest level of protection. Our platform is trusted by over 15,000 users across Africa.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
                  >
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-all duration-300"
                  >
                    Sign in
                  </Link>
                </div>
                
                {/* Trust indicators */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-xs text-gray-400">Trusted by over 15,000 users</div>
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border border-white/10 bg-gray-700"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section (New) */}
      <section id="testimonials" className="relative z-10 mx-auto max-w-7xl px-6 py-24 scroll-mt-20">
        <div className="mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-block bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-3xl font-black text-transparent md:text-4xl"
          >
            What our users say
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-2xl text-gray-300"
          >
            Join thousands of satisfied users who've transformed their savings habits with CreditJambo
          </motion.p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Testimonial 
            quote="CreditJambo revolutionized how I save. The automated deposits and real-time notifications keep me on track every month."
            author="Joyce K."
            role="Small Business Owner"
            location="Goma"
            delay={0.1}
          />
          <Testimonial 
            quote="The security features give me peace of mind. Device verification and instant alerts make me confident my money is safe."
            author="Dan Pierre B."
            role="Network Enginner"
            location="Kigali"
            delay={0.2}
            emphasized
          />
          <Testimonial 
            quote="As a team leader, the Business plan gives me everything I need to manage company funds and track team performance."
            author="Grace M."
            role="Team Manager"
            location="Cape-town"
            delay={0.3}
          />
        </div>
      </section>

      {/* Chat Bot Section (New) */}
      <section id="chatbot" className="relative z-10 mx-auto max-w-7xl px-6 py-24 scroll-mt-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl"
        >
          <div className="grid gap-6 md:grid-cols-2 p-8 relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
            
            <div className="relative order-2 md:order-1">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl h-full flex flex-col">
                <div className="border-b border-white/10 py-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-cyan-300" />
                  <h4 className="text-sm font-medium text-white">CreditJambo Assistant</h4>
                </div>
                
                <div className="flex-1 py-4 space-y-4 overflow-hidden">
                  <div className="max-w-[80%] bg-white/5 rounded-2xl p-3">
                    <p className="text-sm text-gray-300">👋 Hi there! How can I help you with CreditJambo today?</p>
                  </div>
                  <div className="max-w-[80%] bg-white/5 rounded-2xl p-3 self-start">
                    <p className="text-sm text-gray-300">I'm looking for a way to track my savings progress over time.</p>
                  </div>
                  <div className="max-w-[80%] bg-white/5 rounded-2xl p-3">
                    <p className="text-sm text-gray-300">Great question! The CreditJambo app includes advanced analytics that show your savings trends over time. You can view 30-day charts, see deposit patterns, and even get personalized recommendations.</p>
                  </div>
                  <div className="max-w-[80%] bg-white/5 rounded-2xl p-3 self-start">
                    <p className="text-sm text-gray-300">Is that available on the free plan?</p>
                  </div>
                  <div className="max-w-[80%] bg-white/5 rounded-2xl p-3">
                    <p className="text-sm text-gray-300">Basic tracking is available on the free plan, while advanced analytics with detailed reports and custom date ranges is included in our Pro plan at just $4/month.</p>
                  </div>
                </div>
                
                <div className="border-t border-white/10 pt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your question..."
                    className="flex-1 bg-white/5 rounded-lg border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    disabled
                  />
                  <button className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3">
                    <ArrowUpRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2 flex flex-col justify-center">
              <h3 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-2xl font-black text-transparent md:text-3xl">
                24/7 Intelligent Support
              </h3>
              <p className="mt-4 text-gray-300">
                Our AI-powered chat assistant is always ready to answer your questions, guide you through features,
                and help you get the most out of CreditJambo. With natural language understanding and instant responses,
                you'll never feel lost.
              </p>
              
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" /> 
                  <span>Instant answers to common questions</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" /> 
                  <span>Available 24/7, no waiting for business hours</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" /> 
                  <span>Seamless handoff to human agents when needed</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" /> 
                  <span>Personalized guidance based on your account</span>
                </li>
              </ul>
              
              <div className="mt-8">
                <button 
                  onClick={() => setChatOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-sm font-semibold shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
                >
                  Try it now <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ with improved accordion */}
      <section id="faq" className="relative z-10 mx-auto max-w-7xl px-6 py-24 scroll-mt-20">
        <div className="mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-block bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-3xl font-black text-transparent md:text-4xl"
          >
            Frequently asked questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-2xl text-gray-300"
          >
            Find answers to common questions about CreditJambo's features and plans
          </motion.p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Faq
            q="Is CreditJambo free to use?"
            a="Yes — you can start with our Starter plan at no cost. This includes basic savings, OTP reset, and email notifications. Our Pro plan at $4/month adds device verification and push alerts for enhanced security and convenience."
            delay={0.1}
          />
          <Faq
            q="Can I reset my password via OTP?"
            a="Absolutely. We support email and SMS OTP resets with secure token handling. When you request a password reset, we'll send a time-limited code to your verified contact method. This ensures only you can regain access to your account."
            delay={0.2}
          />
          <Faq
            q="Do you support mobile push notifications?"
            a="Yes. Our Pro and Business plans include push notification support. You can plug your Expo/FCM/VAPID keys in settings to receive real-time alerts for deposits, withdrawals, security events, and custom triggers you set up."
            delay={0.3}
          />
          <Faq
            q="Is there an Admin dashboard?"
            a="Yes. Business plan subscribers get access to a comprehensive Admin dashboard where they can manage users, roles, transactions, alerts, and analytics. This includes detailed user activity logs, permission management, and customizable reporting tools."
            delay={0.4}
          />
          <Faq
            q="What currencies do you support?"
            a="CreditJambo currently supports USD, EUR, GBP, RWF, KES, NGN, and ZAR. Our Pro and Business plans include multi-currency accounts with real-time conversion between these currencies at competitive exchange rates."
            delay={0.5}
          />
          <Faq
            q="How does device verification work?"
            a="When you log in from a new device, we'll prompt for verification through your trusted device or email. You'll receive a notification allowing you to approve or deny the login attempt. This adds an extra layer of security to prevent unauthorized access."
            delay={0.6}
          />
          <Faq
            q="Is there a mobile app available?"
            a="Yes. CreditJambo offers native mobile apps for both iOS and Android platforms. The apps include all the features available on the web version, plus biometric authentication, offline balance viewing, and push notifications."
            delay={0.7}
          />
          <Faq
            q="How do I upgrade my plan?"
            a="You can upgrade your plan at any time from your account settings. Changes take effect immediately, and we prorate billing so you only pay for the time you use each plan. Downgrading is also available at the end of your billing cycle."
            delay={0.8}
          />
        </div>
      </section>

      {/* Pre-footer CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl">
            Ready to transform your savings?
          </h3>
          <p className="mx-auto mb-8 max-w-2xl text-gray-300">
            Join thousands of users across Africa who are taking control of their financial future with CreditJambo.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-base font-semibold shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
          >
            Get started for free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer with improved design */}
      <footer className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Wallet className="h-6 w-6 text-emerald-300" />
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-xl font-black tracking-tight text-transparent">
                  CreditJambo
                </span>
              </div>
              <p className="mb-4 text-sm text-gray-400">
                The smarter way to save & grow your finances across Africa.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.32 35.32 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a></li>
                <li><a href="#chatbot" className="hover:text-white transition-colors">Chat Bot</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} CreditJambo. All rights reserved.
            </div>
            <div className="flex gap-6 text-xs text-gray-400">
              <select className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs">
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="sw">Kiswahili</option>
              </select>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Status</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* local styles for animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 250% 0; }
          100% { background-position: -250% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2.2s ease-in-out infinite;
        }
        @keyframes floaty {
          0% { transform: translate3d(0, 0, 0) rotateX(12deg) rotateY(6deg); }
          50% { transform: translate3d(0, -12px, 0) rotateX(10deg) rotateY(8deg); }
          100% { transform: translate3d(0, 0, 0) rotateX(12deg) rotateY(6deg); }
        }
        .coin {
          animation: floaty 4.8s ease-in-out infinite;
          will-change: transform, filter;
          filter: drop-shadow(0 8px 18px rgba(0,0,0,0.35));
        }
      `}</style>
    </div>
  );
}

/* ------------------ special visuals ------------------ */

function CoinField({ coins = [] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {coins.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: i * 0.1 }}
          className="coin absolute"
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            width: c.size,
            height: c.size,
            borderRadius: "50%",
            background:
              "radial-gradient(60% 60% at 35% 35%, rgba(16,185,129,0.65), rgba(6,182,212,0.45) 55%, rgba(99,102,241,0.4))",
            boxShadow:
              "inset 0 2px 8px rgba(255,255,255,0.25), inset 0 -3px 10px rgba(0,0,0,0.35)",
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------ enhanced components ------------------ */

function Stat({ title, value, suffix = "", fixed = 0, icon }) {
  const v = useCountUp(typeof value === "number" ? Math.round(value * (10 ** fixed)) : 0, 1100);
  const display = useMemo(() => {
    if (fixed > 0) return (v / (10 ** fixed)).toFixed(fixed);
    return v.toLocaleString();
  }, [v, fixed]);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl hover:bg-white/10 transition-colors"
    >
      <div className="mb-1 flex items-center justify-center gap-1 text-xs text-gray-400">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-lg font-semibold text-white">
        {display}
        {suffix}
      </div>
    </motion.div>
  );
}

function ShowcaseTile({ icon, title, text, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl hover:border-white/20 transition-all duration-300"
    >
      <div className="mb-2 inline-flex items-center gap-2 text-sm text-gray-200">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </motion.div>
  );
}

function FeatureCard({ icon, title, text, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10"
    >
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/5 blur-2xl transition group-hover:scale-125 duration-500" />
      
      <div className="mb-4 inline-flex items-center justify-center h-10 w-10 rounded-xl bg-black/20 border border-white/10">
        {icon}
      </div>
      
      <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400">{text}</p>
      
      <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
        <span className="text-xs text-gray-500">Available in all plans</span>
        <button className="text-xs text-emerald-300 hover:text-emerald-200 transition-colors">
          Learn more
        </button>
      </div>
    </motion.div>
  );
}

function SecurityFeature({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function Plan({ badge, price, items = [], emphasized = false, cta, to, description, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={cls(
        "relative flex flex-col overflow-hidden rounded-3xl border p-6 backdrop-blur-xl",
        emphasized
          ? "border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 shadow-[0_15px_40px_-12px_rgba(16,185,129,0.35)]"
          : "border-white/10 bg-white/5"
      )}
    >
      {/* Top corner accent */}
      {emphasized && (
        <div className="absolute -right-6 -top-6 h-16 w-16 rotate-45 bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-20 blur-lg" />
      )}
      
      {/* Badge */}
      <div className="mb-1 text-sm font-semibold text-white">
        {badge}
        {emphasized && <span className="ml-2 text-xs text-emerald-300">POPULAR</span>}
      </div>
      
      {/* Price */}
      <div className="mb-2 text-3xl font-black">{price}</div>
      
      {/* Description */}
      <p className="mb-4 text-sm text-gray-400">{description}</p>
      
      {/* Divider */}
      <div className="mb-4 border-t border-white/10"></div>
      
      {/* Features */}
      <ul className="mb-6 space-y-3 text-sm text-gray-300">
        {items.map((i, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <CheckCircle2 className={emphasized && idx < 8 ? "h-4 w-4 text-emerald-300" : "h-4 w-4 text-gray-400"} /> 
            <span>{i}</span>
          </li>
        ))}
      </ul>
      
      {/* CTA */}
      <Link
        to={to}
        className={cls(
          "mt-auto inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm transition-all duration-300",
          emphasized
            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold shadow-lg hover:shadow-emerald-500/20"
            : "border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
        )}
      >
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

function Testimonial({ quote, author, role, location, emphasized = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={cls(
        "relative flex flex-col overflow-hidden rounded-3xl border p-6 backdrop-blur-xl",
        emphasized
          ? "border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10"
          : "border-white/10 bg-white/5"
      )}
    >
      {/* Quote mark */}
      <div className="mb-4 text-4xl font-black text-white/10">"</div>
      
      {/* Quote text */}
      <p className="mb-6 text-sm text-gray-300 flex-1">
        {quote}
      </p>
      
      {/* Author info */}
      <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/10"></div>
        <div>
          <div className="text-sm font-medium text-white">{author}</div>
          <div className="text-xs text-gray-400">{role}, {location}</div>
        </div>
      </div>
    </motion.div>
  );
}

function Faq({ q, a, delay = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between p-4 text-left"
      >
        <h4 className="text-sm font-semibold text-gray-100">{q}</h4>
        <div className={`flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-white/5 p-4">
              <p className="text-sm text-gray-300">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}