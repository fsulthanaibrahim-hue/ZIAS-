import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  FaCode, FaCloud, FaMobileAlt, FaRobot,
  FaShieldAlt, FaChartBar,
  FaComments, FaProjectDiagram, FaUserTie,
  FaBook, FaBriefcase, FaArrowRight, FaCrown,
  FaStar, FaClock, FaUsers, FaCheckCircle,
  FaQuoteLeft, FaAward, FaBolt, FaFire,
  FaMedal, FaLaptopCode, FaPlay
} from "react-icons/fa";
import Footer from "../components/Footer";
import coursesImg from "../assets/images/coursesImg.png";

/* ─── Matches Home page exactly ─── */
const styles = {
  gradientText: {
    background: "linear-gradient(135deg, #16a34a 0%, #059669 50%, #0d9488 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  cardGlow: {
    boxShadow: "0 0 0 1px rgba(22,163,74,0.08), 0 4px 24px rgba(22,163,74,0.08)",
  },
  cardHoverGlow: {
    boxShadow: "0 0 0 1px rgba(22,163,74,0.2), 0 8px 40px rgba(22,163,74,0.15)",
  },
};

/* ─── Section Label — exact copy from Home ─── */
const SectionLabel = ({ children }) => (
  <motion.div
    className="flex justify-center mb-4"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
  >
    <span
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-sm"
      style={{
        background: "rgba(240,253,244,0.8)",
        color: "#16a34a",
        letterSpacing: "0.12em",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
      {children}
    </span>
  </motion.div>
);

/* ─── Glass Card — exact copy from Home ─── */
const GlassCard = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={`backdrop-blur-md bg-white/70 rounded-2xl border border-white/30 shadow-xl ${className}`}
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.02)" }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      {children}
    </motion.div>
  );
};

/* ─── Brototype-style dark course card (unique to this page) ─── */
const CourseCard = ({ Icon, title, tagline, desc, features, accent, index, duration, modules }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1c1c1c" : "#161616",
        border: `1px solid ${hovered ? `${accent}55` : "rgba(255,255,255,0.07)"}`,
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 24px 56px rgba(0,0,0,0.45), 0 0 0 1px ${accent}33`
          : "0 4px 20px rgba(0,0,0,0.25)",
        position: "relative",
        cursor: "default",
      }}
    >
      {/* Top gradient band */}
      <div
        style={{
          height: hovered ? "4px" : "2px",
          background: hovered
            ? `linear-gradient(90deg, ${accent}, ${accent}99)`
            : "rgba(255,255,255,0.04)",
          transition: "all 0.35s ease",
        }}
      />

      <div style={{ padding: "22px 22px 20px", display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Icon + AI badge row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div
            style={{
              width: "46px", height: "46px", borderRadius: "12px",
              background: hovered ? accent : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.3s ease",
              boxShadow: hovered ? `0 6px 20px ${accent}55` : "none",
            }}
          >
            <Icon style={{ fontSize: "20px", color: hovered ? "#fff" : "rgba(255,255,255,0.4)", transition: "color 0.3s" }} />
          </div>

          {/* AI Integrated badge */}
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              fontSize: "10.5px", fontWeight: "700",
              color: hovered ? "#f59e0b" : "rgba(245,158,11,0.6)",
              background: hovered ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.06)",
              border: `1px solid ${hovered ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.1)"}`,
              borderRadius: "6px", padding: "3px 10px",
              transition: "all 0.3s",
              fontFamily: "'Georgia', sans-serif",
            }}
          >
            ✦ AI Integrated
          </span>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: "4px" }}>
            <FaClock style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }} />
            {duration}
          </span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
            Mode: offline / online
          </span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
            Modules: {modules}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "19px", fontWeight: "700",
            color: hovered ? "#fff" : "rgba(255,255,255,0.85)",
            lineHeight: "1.25", marginBottom: "4px",
            letterSpacing: "-0.01em",
            transition: "color 0.3s",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "11px", fontWeight: "600",
            letterSpacing: "0.07em", textTransform: "uppercase",
            color: hovered ? accent : "rgba(255,255,255,0.25)",
            marginBottom: "12px",
            transition: "color 0.3s",
          }}
        >
          {tagline}
        </p>

        {/* Desc */}
        <p
          style={{
            fontSize: "13px", color: "rgba(255,255,255,0.4)",
            lineHeight: "1.7", marginBottom: "16px",
          }}
        >
          {desc}
        </p>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px", flex: 1 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div
                style={{
                  width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
                  background: hovered ? `${accent}25` : "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.3s",
                }}
              >
                <FaCheckCircle style={{ fontSize: "8px", color: hovered ? accent : "rgba(255,255,255,0.2)" }} />
              </div>
              <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.5)" }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "14px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <Link
            to="/contact"
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "12px", fontWeight: "700",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: hovered ? accent : "rgba(255,255,255,0.35)",
              textDecoration: "none", transition: "color 0.3s",
            }}
          >
            Enroll Now <FaArrowRight style={{ fontSize: "9px" }} />
          </Link>
          <div style={{ display: "flex", gap: "2px" }}>
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} style={{ fontSize: "9px", color: hovered ? "#f59e0b" : "rgba(255,255,255,0.1)" }} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Highlight Card — matches Home style ─── */
const HighlightCard = ({ icon: Icon, title, desc, stat, index }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `1.5px solid ${hovered ? "#16a34a" : "#e5f7ee"}`,
        borderRadius: "18px",
        padding: "28px 24px",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 16px 40px rgba(22,163,74,0.14)"
          : "0 2px 16px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Big stat watermark */}
      <div
        style={{
          position: "absolute", top: "12px", right: "16px",
          fontFamily: "'Georgia', serif",
          fontSize: "40px", fontWeight: "900", lineHeight: 1,
          color: hovered ? "rgba(22,163,74,0.15)" : "rgba(0,0,0,0.04)",
          transition: "color 0.3s",
          userSelect: "none",
        }}
      >
        {stat}
      </div>

      {/* Icon */}
      <div
        style={{
          width: "46px", height: "46px", borderRadius: "13px",
          background: hovered
            ? "linear-gradient(135deg,#16a34a,#059669)"
            : "linear-gradient(135deg,#dcfce7,#bbf7d0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "16px",
          transition: "all 0.3s ease",
          boxShadow: hovered ? "0 6px 18px rgba(22,163,74,0.3)" : "none",
        }}
      >
        <Icon style={{ fontSize: "19px", color: hovered ? "#fff" : "#16a34a" }} />
      </div>

      <h3
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "16px", fontWeight: "700",
          color: "#111827", marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.68" }}>{desc}</p>
    </motion.div>
  );
};

/* ─── Who-for card ─── */
const WhoCard = ({ emoji, title, desc, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex", gap: "18px", alignItems: "flex-start",
        padding: "22px 24px",
        background: "#fff",
        border: "1px solid rgba(22,163,74,0.08)",
        borderRadius: "14px",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(22,163,74,0.25)";
        e.currentTarget.style.transform = "translateX(6px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(22,163,74,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(22,163,74,0.08)";
        e.currentTarget.style.transform = "translateX(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span style={{ fontSize: "28px", lineHeight: 1, marginTop: "3px", flexShrink: 0 }}>{emoji}</span>
      <div>
        <h3 style={{ fontFamily: "'Georgia', serif", fontSize: "17px", fontWeight: "700", color: "#111827", marginBottom: "7px" }}>
          {title}
        </h3>
        <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.72" }}>{desc}</p>
      </div>
    </motion.div>
  );
};

/* ─── Main Courses Page ─── */
const Courses = () => {
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const courses = [
    {
      Icon: FaCode, title: "Full Stack Web Development",
      tagline: "Frontend · Backend · Deploy",
      desc: "Build responsive, modern full-stack web applications from ground up to production deployment.",
      features: ["React, Next.js & Tailwind CSS", "Node.js, Express & REST APIs", "MongoDB, PostgreSQL & deployment"],
      accent: "#16a34a", duration: "16 Weeks", modules: 52,
    },
    {
      Icon: FaMobileAlt, title: "Mobile App Development",
      tagline: "iOS · Android · Cross-Platform",
      desc: "Create native and cross-platform mobile apps for iOS and Android with modern frameworks.",
      features: ["React Native & Expo", "Flutter & Dart", "App Store & Play Store publishing"],
      accent: "#0891b2", duration: "14 Weeks", modules: 52,
    },
    {
      Icon: FaShieldAlt, title: "Cyber Security",
      tagline: "Protect · Detect · Respond",
      desc: "Learn cybersecurity fundamentals to protect modern digital systems and enterprise infrastructure.",
      features: ["Network Security & Ethical Hacking", "OWASP Top 10 & Vulnerability Assessment", "SOC & Incident Response"],
      accent: "#dc2626", duration: "18 Weeks", modules: 52,
    },
    {
      Icon: FaRobot, title: "AI / Machine Learning",
      tagline: "ML · Deep Learning · LLMs",
      desc: "Build intelligent systems using AI and machine learning concepts deployed in real production.",
      features: ["Python, Pandas & NumPy", "Machine Learning & Scikit-learn", "Deep Learning & TensorFlow"],
      accent: "#7c3aed", duration: "20 Weeks", modules: 52,
    },
    {
      Icon: FaChartBar, title: "Data Science",
      tagline: "Analyze · Visualize · Predict",
      desc: "Turn raw data into insights using analytics and machine learning to drive real business decisions.",
      features: ["Data Analysis & Visualization", "Statistical Modeling & Python", "BI Tools & Dashboarding"],
      accent: "#d97706", duration: "16 Weeks", modules: 52,
    },
    {
      Icon: FaCloud, title: "DevOps & Cloud",
      tagline: "Infrastructure · CI/CD · Scale",
      desc: "Ship software confidently with containers, cloud infrastructure and automation used by top teams.",
      features: ["Docker & Kubernetes", "AWS, GCP & Azure", "CI/CD with GitHub Actions"],
      accent: "#ea580c", duration: "12 Weeks", modules: 52,
    },
  ];

  const highlights = [
    { icon: FaProjectDiagram, title: "Live Industry Projects", desc: "Build deployed, real-world apps that employers actually want to see in your portfolio.", stat: "5+" },
    { icon: FaUserTie, title: "1-on-1 Mentorship", desc: "Personal guidance from experienced engineers throughout your entire learning journey.", stat: "1:1" },
    { icon: FaBriefcase, title: "Placement Support", desc: "Resume building, mock interviews, and active job referrals until you're hired.", stat: "93%" },
    { icon: FaBook, title: "Structured Curriculum", desc: "52 carefully designed modules from zero fundamentals to advanced concepts.", stat: "52" },
    { icon: FaComments, title: "Communication Training", desc: "Soft skills and team collaboration woven into every program phase.", stat: "12+" },
    { icon: FaAward, title: "Certified Recognition", desc: "An industry-recognised certificate that carries real weight with hiring managers.", stat: "4.9★" },
  ];

  return (
    <main className="font-sans overflow-x-hidden bg-gradient-to-br from-white via-green-50/30 to-white">

      {/* Background blur orbs — same as Home */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-10 -translate-x-1/2" />
      </div>

      {/* ── HERO — matches Home hero style ── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative py-20 md:py-28 overflow-hidden"
        style={{ background: "linear-gradient(160deg, rgba(240,253,244,0.6) 0%, rgba(255,255,255,0.8) 50%, rgba(236,253,245,0.6) 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">

            {/* Left text */}
            <motion.div
              className="flex-1 text-center md:text-left"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Label pill */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex justify-center md:justify-start mb-5"
              >
                <span
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
                  style={{ background: "rgba(220,252,231,0.8)", color: "#15803d", border: "1px solid rgba(187,247,208,0.8)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  ZIAS Academy · AI Integrated
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-5 leading-[1.08]"
                style={{ fontFamily: "'Georgia', serif" }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32 }}
              >
                Our <span style={styles.gradientText}>Professional</span>
                <br />
                <span style={{ ...styles.gradientText, fontStyle: "italic" }}>Courses.</span>
              </motion.h1>

              <motion.p
                className="text-base md:text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.44 }}
              >
                Industry-focused programs designed to make you a skilled, job-ready developer. Learn modern technologies with hands-on projects and real mentorship.
              </motion.p>

              {/* Stats row */}
              <motion.div
                className="flex gap-8 justify-center md:justify-start mb-8"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.52 }}
              >
                {[
                  { n: "06", l: "Courses" },
                  { n: "52", l: "Modules" },
                  { n: "93%", l: "Placement" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Georgia', serif", fontSize: "26px", fontWeight: "900", color: "#16a34a", lineHeight: 1 }}>{s.n}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", marginTop: "3px", letterSpacing: "0.04em" }}>{s.l}</div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.58 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all duration-300 backdrop-blur-sm"
                    style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}
                  >
                    Enroll Now <FaArrowRight className="text-sm" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/about"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-green-700 bg-white/80 backdrop-blur-sm border border-green-200 hover:border-green-400 transition-all duration-300"
                  >
                    Learn More
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right — image with floating badges */}
            <motion.div
              className="flex-1 flex justify-center"
              initial={{ x: 50, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-3xl opacity-40"
                  style={{ background: "radial-gradient(circle at 50% 50%,#bbf7d0,transparent 70%)", transform: "scale(1.15)" }}
                />
                <motion.img
                  src={coursesImg}
                  alt="Courses"
                  className="relative rounded-3xl w-3/4 md:w-full max-w-md backdrop-blur-sm"
                  style={{ boxShadow: "0 24px 80px rgba(22,163,74,0.2), 0 8px 32px rgba(0,0,0,0.1)" }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Floating badge top-left */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, x: -16 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 0.85, duration: 0.5 }}
                  style={{
                    position: "absolute", top: "18px", left: "-18px",
                    background: "#fff", border: "1.5px solid #d1fae5",
                    borderRadius: "14px", padding: "10px 14px",
                    boxShadow: "0 8px 24px rgba(22,163,74,0.14)",
                    display: "flex", alignItems: "center", gap: "9px",
                  }}
                >
                  <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg,#16a34a,#059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FaStar style={{ color: "#fff", fontSize: "13px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "800", color: "#111827", lineHeight: 1, fontFamily: "'Georgia', serif" }}>4.9 / 5</div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Student Rating</div>
                  </div>
                </motion.div>

                {/* Floating badge bottom-right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, x: 16 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 1.05, duration: 0.5 }}
                  style={{
                    position: "absolute", bottom: "18px", right: "-18px",
                    background: "#fff", border: "1.5px solid #d1fae5",
                    borderRadius: "14px", padding: "10px 14px",
                    boxShadow: "0 8px 24px rgba(22,163,74,0.14)",
                    display: "flex", alignItems: "center", gap: "9px",
                  }}
                >
                  <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg,#dcfce7,#bbf7d0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FaCheckCircle style={{ color: "#16a34a", fontSize: "13px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "800", color: "#111827", lineHeight: 1, fontFamily: "'Georgia', serif" }}>2,400+</div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Students Enrolled</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── TRUST BAR — dark strip like Brototype ── */}
      <section style={{ background: "#0f1a12", padding: "14px 32px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "36px", flexWrap: "wrap" }}>
          {[
            { icon: FaAward, t: "Industry Recognised Certificate" },
            { icon: FaLaptopCode, t: "Real Production Projects" },
            { icon: FaBolt, t: "AI-Integrated Curriculum" },
            { icon: FaUsers, t: "Active Hiring Network" },
          ].map(({ icon: I, t }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <I style={{ fontSize: "12px", color: "#4ade80" }} />
              <span style={{ fontSize: "11.5px", fontWeight: "500", color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── COURSES GRID — dark cards on light bg ── */}
      <section
        className="py-20 md:py-28"
        style={{ background: "linear-gradient(160deg, rgba(240,253,244,0.3) 0%, #ffffff 60%, rgba(236,253,245,0.3) 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <SectionLabel>Our Programs</SectionLabel>
            <h2
              className="text-3xl md:text-5xl font-bold text-gray-900 mt-2"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Explore Our <span style={styles.gradientText}>Courses</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-base leading-relaxed">
              Industry-aligned programs with AI-integrated curriculum and hands-on project experience.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {courses.map((c, i) => <CourseCard key={i} {...c} index={i} />)}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section
        className="py-16"
        style={{ background: "#f8fafc" }}
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <FaQuoteLeft className="text-green-300 text-3xl mx-auto mb-6" />
            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "clamp(18px,2.5vw,24px)",
                fontStyle: "italic", color: "#1f2937",
                lineHeight: "1.6", marginBottom: "28px",
              }}
            >
              "ZIAS didn't just teach me to code — they built my entire career foundation. The real projects, 1:1 mentorship, and job referrals. I was hired before the course even ended."
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
              <div
                style={{
                  width: "46px", height: "46px", borderRadius: "50%",
                  background: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Georgia', serif",
                  fontSize: "18px", fontWeight: "700", color: "#15803d",
                }}
              >
                R
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: "16px", fontWeight: "700", color: "#111827" }}>Rana Fathima</div>
                <div style={{ fontSize: "11px", color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>Full Stack Developer · Batch 2025</div>
              </div>
              <div style={{ display: "flex", gap: "3px", marginLeft: "6px" }}>
                {[...Array(5)].map((_, i) => <FaStar key={i} style={{ fontSize: "12px", color: "#d97706" }} />)}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HIGHLIGHTS — matches Home card style ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/80 backdrop-blur-sm border border-green-200 mb-5">
              <FaCrown className="text-green-600 text-sm" />
              <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">Why ZIAS Works</span>
            </div>
            <h2
              className="text-3xl md:text-5xl font-bold text-gray-900"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              What Sets Us{" "}
              <span style={styles.gradientText}>Apart</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-base leading-relaxed">
              Not just a bootcamp. Every element is designed to make employers take notice of you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            {highlights.slice(0, 3).map((h, i) => <HighlightCard key={i} {...h} index={i} />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {highlights.slice(3).map((h, i) => <HighlightCard key={i} {...h} index={i + 3} />)}
          </div>
        </div>
      </section>

      {/* ── WHO IS THIS FOR ── */}
      <section
        className="py-20 md:py-24"
        style={{ background: "linear-gradient(160deg, rgba(240,253,244,0.4) 0%, #ffffff 60%, rgba(236,253,245,0.4) 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: "72px", alignItems: "start" }}>

            {/* Left sticky */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              style={{ position: "sticky", top: "100px" }}
            >
              <SectionLabel>For Everyone</SectionLabel>
              <h2
                className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight mt-2 mb-4"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Who Is <span style={styles.gradientText}>This For?</span>
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Regardless of where you start, our programs are built to take you far beyond where you thought possible.
              </p>
              <div style={{ width: "36px", height: "3px", background: "linear-gradient(90deg,#16a34a,#059669)", borderRadius: "2px" }} />
            </motion.div>

            {/* Right cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { e: "🎓", t: "Students & Freshers", d: "Zero experience? Perfect starting point. We build your skills from the ground up — every module designed for the complete beginner who wants to become a professional developer." },
                { e: "🔁", t: "Career Switchers", d: "From teaching, business, or any other field. Hundreds of ZIAS graduates had no tech background and are now working full-time as developers at top companies." },
                { e: "🚀", t: "Working Professionals", d: "Self-paced modules built for busy schedules. Learn on evenings and weekends at your own rhythm, without pausing your income or your life." },
              ].map((c, i) => (
                <WhoCard key={i} emoji={c.e} title={c.t} desc={c.d} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA — matches Home ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #052e16 0%, #14532d 60%, #166534 100%)" }}
      >
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle,#4ade80,transparent 70%)", transform: "translate(30%,-30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#86efac,transparent 70%)", transform: "translate(-30%,30%)" }}
        />

        <div className="max-w-3xl mx-auto text-center px-4 relative z-10">
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.1)", color: "#86efac" }}
          >
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Start Your Journey Today
          </motion.span>

          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Ready to Start Your{" "}
            <span className="bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-transparent">
              Learning Journey?
            </span>
          </motion.h2>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-base md:text-lg text-green-200 mb-8 max-w-xl mx-auto leading-relaxed"
          >
            Join 2,400+ students who have transformed their careers with ZIAS. Your journey starts with one click.
          </motion.p>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-green-900 bg-white hover:bg-green-50 transition-all duration-300 shadow-lg backdrop-blur-sm"
              >
                Enroll Now <FaArrowRight />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold backdrop-blur-sm transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.1)", color: "#86efac", border: "1px solid rgba(134,239,172,0.3)" }}
              >
                View Curriculum
              </Link>
            </motion.div>
          </motion.div>

          {/* Mini trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap", marginTop: "36px", paddingTop: "28px", borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            {["No prior experience needed", "Self-paced & flexible", "Certificate on completion"].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <FaCheckCircle style={{ fontSize: "11px", color: "#4ade80" }} />
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>{t}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </main>
  );
};

export default Courses;