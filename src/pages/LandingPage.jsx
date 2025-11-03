// src/pages/LandingPage.jsx
import { motion } from "framer-motion";
import {
    ArrowRight,
    ArrowUpRight,
    Banknote,
    BarChart3,
    BellRing,
    CheckCircle2,
    Lock,
    Moon,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Sun,
    Users,
    Wallet,
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
  const active = useScrollSpy(["features", "pricing", "security", "faq"]);

  // parallax layers
  const parallax1 = useParallax(0.08);
  const parallax2 = useParallax(0.12);
  const parallax3 = useParallax(0.06);

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
    ],
    []
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white scroll-smooth">
      {/* Ambient/parallax gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-28 -left-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl"
          style={parallax1}
        />
        <div
          className="absolute top-52 -right-28 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-3xl"
          style={parallax2}
        />
        <div
          className="absolute bottom-[-8rem] left-[25%] h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"
          style={parallax3}
        />
      </div>

      {/* Floating 3D coins */}
      <CoinField coins={coins} />

      {/* Nav */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="group flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur">
              <Wallet className="h-6 w-6 text-emerald-300 group-hover:scale-110 transition-transform" />
            </div>
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-xl font-black tracking-tight text-transparent">
              CreditJambo
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className={cls(
                "text-sm transition-colors",
                active === "features" ? "text-white" : "text-gray-300 hover:text-white"
              )}
            >
              Features
            </a>
            <a
              href="#pricing"
              className={cls(
                "text-sm transition-colors",
                active === "pricing" ? "text-white" : "text-gray-300 hover:text-white"
              )}
            >
              Pricing
            </a>
            <a
              href="#security"
              className={cls(
                "text-sm transition-colors",
                active === "security" ? "text-white" : "text-gray-300 hover:text-white"
              )}
            >
              Security
            </a>
            <a
              href="#faq"
              className={cls(
                "text-sm transition-colors",
                active === "faq" ? "text-white" : "text-gray-300 hover:text-white"
              )}
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-1 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-gray-200 hover:bg-white/10"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold shadow-[0_10px_30px_-12px_rgba(16,185,129,0.45)]"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — full screen */}
      <section className="relative z-10 mx-auto flex h-screen max-w-7xl flex-col justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            The smarter way to save & grow
          </div>

          {/* Shimmer headline */}
          <h1
            className={cls(
              "text-4xl font-black leading-tight tracking-tight md:text-6xl",
              "bg-clip-text text-transparent",
              shimmerOn
                ? "animate-shimmer bg-[linear-gradient(110deg,#fff,45%,#9ca3af,55%,#fff)] bg-[length:200%_100%]"
                : "bg-gradient-to-br from-white via-white to-gray-300"
            )}
          >
            Save. Withdraw. Grow.
            <br className="hidden md:block" />
            All in one sleek app.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-balance text-gray-300">
            CreditJambo helps you automate savings, track insights, and stay secure with device
            verification, OTP resets, and real-time alerts — built for Africa’s next billion.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-semibold"
            >
              Create free account
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-gray-200 hover:bg-white/10"
            >
              Learn more
            </a>
          </div>

          {/* Premium Stat counters */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat title="Active Users" value={10000} suffix="+" />
            <Stat title="Avg. APY (promo)" value={3.5} fixed={1} suffix="%" />
            <Stat title="Countries" value={5} suffix="+" />
            <Stat title="Uptime" value={99.99} fixed={2} suffix="%" />
          </div>
        </motion.div>

        {/* Showcase card */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-12 w-full max-w-5xl lg:mt-20"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-2xl" />
            <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="grid gap-4 md:grid-cols-3">
              <ShowcaseTile
                icon={<Banknote className="h-5 w-5 text-emerald-300" />}
                title="Instant Deposits"
                text="Top up in seconds and track balance after each transaction."
              />
              <ShowcaseTile
                icon={<BarChart3 className="h-5 w-5 text-cyan-300" />}
                title="Smart Insights"
                text="See trends over 30 days and discover your saving rhythm."
              />
              <ShowcaseTile
                icon={<BellRing className="h-5 w-5 text-indigo-300" />}
                title="Real-time Alerts"
                text="Low balance warnings, deposit confirmations & more."
              />
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm text-gray-400">
              What you saw in the Admin Dashboard? This is the companion experience for users —
              fast, secure, and delightful.
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-2xl font-black text-transparent md:text-3xl">
          Powerful features, minimal effort
        </h2>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
            title="Device Verification"
            text="Approve or reject login devices for extra protection."
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5 text-cyan-300" />}
            title="OTP Password Reset"
            text="Regain access with secure one-time codes via email or SMS."
          />
          <FeatureCard
            icon={<Smartphone className="h-5 w-5 text-indigo-300" />}
            title="Push Notifications"
            text="Stay up to date on deposits, withdrawals & low-balance events."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5 text-emerald-300" />}
            title="Admin Controls"
            text="Admins manage users, roles, balances & login activity."
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5 text-cyan-300" />}
            title="Analytics"
            text="Monitor performance and see top savers at a glance."
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-5 w-5 text-indigo-300" />}
            title="Smooth UX"
            text="Built with Tailwind v4 + Framer Motion for buttery animations."
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-2xl font-black text-transparent md:text-3xl">
          Simple, transparent pricing
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Plan
            badge="Starter"
            price="Free"
            items={["Basic savings", "OTP reset", "Email alerts", "Community support"]}
            cta="Get started"
            to="/register"
          />
          <Plan
            badge="Pro"
            price="$4/mo"
            emphasized
            items={[
              "Everything in Starter",
              "Device verification",
              "Push notifications",
              "Priority support",
            ]}
            cta="Upgrade now"
            to="/register"
          />
          <Plan
            badge="Business"
            price="$12/mo"
            items={["Team accounts", "Advanced analytics", "Custom alerts", "SLA support"]}
            cta="Contact sales"
            to="/register"
          />
        </div>
      </section>

      {/* Security / CTA */}
      <section id="security" className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-2xl font-black text-transparent">
                Security baked in
              </h3>
              <p className="mt-2 text-gray-300">
                From OTP resets to device approvals, we designed every flow to protect your funds
                without slowing you down.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-200">
                <li className="list-none rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  Encrypted tokens
                </li>
                <li className="list-none rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  Role-based access
                </li>
                <li className="list-none rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  Admin approvals
                </li>
                <li className="list-none rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  Audit trails
                </li>
              </div>
            </div>
            <div className="flex flex-col items-start justify-center">
              <p className="text-gray-300">
                Ready to experience seamless savings with enterprise-grade security?
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold"
                >
                  Create account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-gray-200 hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <h2 className="mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-2xl font-black text-transparent md:text-3xl">
          Frequently asked questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Faq
            q="Is CreditJambo free to use?"
            a="Yes — start with the Starter plan at no cost. Pro adds device verification & push alerts."
          />
          <Faq
            q="Can I reset my password via OTP?"
            a="Absolutely. We support email OTP resets and secure token handling."
          />
          <Faq
            q="Do you support mobile push notifications?"
            a="Yes. You can plug your Expo/FCM/VAPID keys in settings to receive real-time alerts."
          />
          <Faq
            q="Is there an Admin dashboard?"
            a="Yes. Admins can manage users, roles, transactions, alerts, and analytics."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-300" />
            <span className="text-sm text-gray-300">
              © {new Date().getFullYear()} CreditJambo
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="#security" className="hover:text-gray-200">
              Security
            </a>
            <a href="#pricing" className="hover:text-gray-200">
              Pricing
            </a>
            <a href="#" className="hover:text-gray-200">
              Terms
            </a>
            <a href="#" className="hover:text-gray-200">
              Privacy
            </a>
          </div>
        </div>
      </footer>

      {/* local styles for shimmer/coins */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
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
        <div
          key={i}
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

/* ------------------ small components ------------------ */

function Stat({ title, value, suffix = "", fixed = 0 }) {
  const v = useCountUp(typeof value === "number" ? Math.round(value * (10 ** fixed)) : 0, 1100);
  const display = useMemo(() => {
    if (fixed > 0) return (v / (10 ** fixed)).toFixed(fixed);
    return v.toLocaleString();
  }, [v, fixed]);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-xl">
      <div className="text-xs text-gray-400">{title}</div>
      <div className="text-lg font-semibold text-white">
        {display}
        {suffix}
      </div>
    </div>
  );
}

function ShowcaseTile({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
      <div className="mb-2 inline-flex items-center gap-2 text-sm text-gray-200">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition">
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/5 blur-2xl transition group-hover:scale-125" />
      <div className="mb-2 inline-flex items-center gap-2 text-sm text-gray-200">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

function Plan({ badge, price, items, emphasized, cta, to }) {
  return (
    <div
      className={cls(
        "relative flex flex-col overflow-hidden rounded-3xl border p-6 backdrop-blur-xl",
        emphasized
          ? "border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 shadow-[0_10px_40px_-12px_rgba(16,185,129,0.35)]"
          : "border-white/10 bg-white/5"
      )}
    >
      <div className="mb-2 text-xs text-gray-300">{badge}</div>
      <div className="mb-4 text-3xl font-black">{price}</div>
      <ul className="mb-5 space-y-2 text-sm text-gray-300">
        {items.map((i, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" /> {i}
          </li>
        ))}
      </ul>
      <Link
        to={to}
        className={cls(
          "mt-auto inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm",
          emphasized
            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold"
            : "border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
        )}
      >
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Faq({ q, a }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <summary className="cursor-pointer list-none select-none">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-100">{q}</h4>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300">
            View
          </span>
        </div>
      </summary>
      <p className="mt-3 text-sm text-gray-300">{a}</p>
    </details>
  );
}
