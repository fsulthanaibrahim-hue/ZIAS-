import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/images/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname }            = useLocation();

  /* ── scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── close menu on navigation ── */
  useEffect(() => { setIsOpen(false); }, [pathname]);

  /* ── lock body scroll while mobile menu open ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const navLinks = [
    { name: "Home",       path: "/" },
    { name: "Courses",    path: "/courses", badge: "New" },
    { name: "About Us",   path: "/about" },
    { name: "Contact Us", path: "/contact" },
  ];

  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <>
      {/* ════════════════════════════════════════
          ANNOUNCEMENT BAR
      ════════════════════════════════════════ */}
      <div className="relative overflow-hidden h-[38px] bg-[#0f172a] flex items-center justify-center gap-2.5 px-4 text-[12.5px] font-medium text-slate-400 tracking-wide">
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-[shimmer_3s_infinite]" />
        <span className="w-[6px] h-[6px] rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
        <span className="relative">
          🎓 2025–26 Admissions Open — Seats filling fast!&nbsp;&nbsp;
          <Link
            to="/contact"
            className="text-emerald-400 font-bold border-b border-emerald-500/30 hover:border-emerald-400 transition-colors duration-150"
          >
            Secure Your Spot →
          </Link>
        </span>
      </div>

      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <header
        className={`
          sticky top-0 z-50 border-b border-[#e8edf2]
          transition-all duration-300
          ${scrolled
            ? "bg-white/88 backdrop-blur-2xl shadow-[0_1px_0_#e8edf2,0_8px_32px_rgba(15,23,42,0.08)]"
            : "bg-white/97"
          }
        `}
      >
        <div className="max-w-[1200px] mx-auto px-5 sm:px-7 lg:px-8">
          <div className="flex items-center justify-between h-[72px] gap-5">

            {/* ── LOGO ── */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
              <img
                src={logo}
                alt="Logo"
                className="h-35 mt-5 w-auto object-contain
                  transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  group-hover:scale-105"
              />
            </Link>

            {/* ── DESKTOP NAV LINKS ── */}
            <nav className="hidden lg:flex items-center flex-1 justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`
                    group/link relative flex items-center gap-1.5
                    px-[17px] py-[9px] rounded-xl
                    text-[14.5px] font-semibold whitespace-nowrap
                    transition-colors duration-150
                    ${isActive(link.path)
                      ? "text-emerald-500"
                      : "text-slate-500 hover:text-[#0f172a] hover:bg-slate-50"
                    }
                  `}
                >
                  {link.name}

                  {link.badge && (
                    <span className="text-[9.5px] font-extrabold uppercase tracking-[0.04em] bg-red-50 text-red-500 px-[6px] py-[2px] rounded-[5px] leading-[1.4]">
                      {link.badge}
                    </span>
                  )}

                  {/* animated underline bar */}
                  <span
                    className={`
                      absolute bottom-[-1px] left-1/2 -translate-x-1/2
                      w-6 h-[2.5px] bg-emerald-500 rounded-full
                      transition-transform duration-[250ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
                      ${isActive(link.path)
                        ? "scale-x-100"
                        : "scale-x-0 group-hover/link:scale-x-50"
                      }
                    `}
                  />
                </Link>
              ))}
            </nav>

            {/* ── DESKTOP RIGHT ACTIONS ── */}
            <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0">

              {/* phone pill */}
              <a
                href="tel:+919876543210"
                className="
                  group/phone flex items-center gap-[7px]
                  px-[14px] py-[8px] rounded-full
                  bg-slate-50 border border-[#e2e8f0]
                  text-[13px] font-bold text-[#334155]
                  transition-all duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                  hover:bg-emerald-500 hover:border-emerald-500 hover:text-white
                  hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)]
                  whitespace-nowrap
                "
              >
                <svg
                  className="w-[13px] h-[13px] flex-shrink-0 transition-transform duration-150 group-hover/phone:rotate-[10deg]"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 8.81 19.79 19.79 0 0 1 2 .18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.13 1 .36 1.97.71 2.9a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.18-1.18a2 2 0 0 1 2.11-.45c.93.35 1.9.58 2.9.71A2 2 0 0 1 22 16.92z" />
                </svg>
                +91 70344 66440
              </a>

              {/* divider */}
              <span className="w-[1px] h-[22px] bg-[#e2e8f0] mx-0.5" />

              {/* Get Started */}
              <Link
                to="/login"
                className="
                  group/cta relative overflow-hidden
                  flex items-center gap-2 px-[22px] py-[10px] rounded-xl
                  text-[14px] font-bold text-white bg-[#0f172a]
                  transition-all duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  hover:bg-emerald-500 hover:-translate-y-[2px]
                  hover:shadow-[0_10px_24px_rgba(16,185,129,0.38)]
                "
              >
                {/* shimmer sweep */}
                <span className="
                  pointer-events-none absolute inset-0
                  bg-gradient-to-r from-transparent via-white/10 to-transparent
                  -translate-x-full group-hover/cta:translate-x-full
                  transition-transform duration-[400ms]
                " />

                <span className="relative">Get Started</span>

                {/* arrow icon box */}
                <span className="
                  relative flex items-center justify-center
                  w-5 h-5 rounded-[6px] bg-white/15 flex-shrink-0
                  transition-all duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  group-hover/cta:translate-x-[3px] group-hover/cta:bg-white/25
                ">
                  <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>

            {/* ── MOBILE HAMBURGER ── */}
            <button
              onClick={() => setIsOpen((p) => !p)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              className="
                lg:hidden flex flex-col gap-[5px] items-center justify-center
                w-[42px] h-[42px] rounded-[11px]
                bg-slate-50 border border-[#e2e8f0]
                transition-colors duration-150
                hover:bg-slate-100 hover:border-slate-300
              "
            >
              <span className={`block h-[1.8px] bg-slate-500 rounded-full transition-all duration-[250ms]
                ${isOpen ? "w-5 translate-y-[6.8px] rotate-45" : "w-5"}`} />
              <span className={`block h-[1.8px] bg-slate-500 rounded-full transition-all duration-[250ms]
                ${isOpen ? "opacity-0 scale-x-0" : "w-[13px] ml-auto"}`} />
              <span className={`block h-[1.8px] bg-slate-500 rounded-full transition-all duration-[250ms]
                ${isOpen ? "w-5 -translate-y-[6.8px] -rotate-45" : "w-[17px]"}`} />
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════
            MOBILE MENU DROPDOWN
        ════════════════════════════════════════ */}
        {isOpen && (
          <div className="
            lg:hidden absolute top-full left-0 right-0
            bg-white border-t border-slate-100
            px-4 pb-5 pt-3
            shadow-[0_24px_48px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.06)]
            animate-[mobSlide_0.22s_cubic-bezier(0.4,0,0.2,1)]
          ">
            {/* nav links */}
            <nav className="flex flex-col gap-[2px] mb-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center justify-between
                    px-[14px] py-[11px] rounded-xl
                    text-[15px] font-semibold
                    transition-all duration-150
                    ${isActive(link.path)
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-[#0f172a]"
                    }
                  `}
                >
                  {link.name}
                  {link.badge && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wide bg-red-50 text-red-500 px-2 py-[2px] rounded-[5px]">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* separator */}
            <div className="h-[1px] bg-slate-100 my-3" />

            {/* phone */}
            <a
              href="tel:+917034466440"
              className="
                flex items-center justify-center gap-2
                w-full py-[11px] mb-2.5 rounded-xl
                bg-slate-50 border border-[#e2e8f0]
                text-[14px] font-bold text-[#334155]
                transition-colors duration-150 hover:bg-slate-100
              "
            >
              <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 8.81 19.79 19.79 0 0 1 2 .18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.13 1 .36 1.97.71 2.9a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.18-1.18a2 2 0 0 1 2.11-.45c.93.35 1.9.58 2.9.71A2 2 0 0 1 22 16.92z"/>
              </svg>
              +91 70344 66440
            </a>

            {/* CTA row */}
            <div className="flex gap-2">

              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="
                  flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  text-[14px] font-bold text-white bg-[#0f172a]
                  hover:bg-emerald-500
                  shadow-[0_4px_12px_rgba(15,23,42,0.2)]
                  hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)]
                  transition-all duration-200
                "
              >
                Get Started
                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;