import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useAnimation } from "framer-motion";
import {
  FaCheckCircle, FaUsers, FaGlobe, FaLightbulb,
  FaCode, FaMobileAlt, FaShieldAlt, FaBrain,
  FaGamepad, FaChartBar,
  FaStar,
  FaQuoteLeft, FaNewspaper, FaCalendarAlt, FaArrowRight,
  FaGithub, FaLinkedin, FaTwitter, FaAward, FaBriefcase, FaRocket,
  FaTerminal, FaLayerGroup, FaAtom, FaCrown,
  FaClock, FaLaptopCode, FaCertificate, FaBuilding, FaHandshake,
  FaPlay, FaUserGraduate, FaTrophy, FaHeart, FaRegSmile, FaThumbsUp,
  FaExternalLinkAlt
} from "react-icons/fa";
import Footer from "../components/Footer";
import heroImg from "../assets/images/heroImg.png";
import coursesImg from "../assets/images/coursesImg.png";
import journeyImg from "../assets/images/journeyImg.jpg";
import zias from "../assets/images/zias.png";

import porscheImg from "../assets/images/Porsche.png";
import zenlyImg from "../assets/images/Zenly.png";
import hostelImg from "../assets/images/ilham.png";
import bmwImg from "../assets/images/BMW.png";

const theme = {
  primary: "#16a34a",
  primaryLight: "#22c55e",
  primaryDark: "#15803d",
  secondary: "#059669",
  accent: "#0d9488",
};

const styles = {
  gradientText: {
    background: `linear-gradient(135deg, #16a34a 0%, #059669 50%, #0d9488 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
};

/* ─── Animated Counter ─── */
const Counter = ({ target, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);
  return <span ref={ref}>{count}</span>;
};

/* ─── FAQ Item ─── */
const FaqItem = ({ question, answer, isOpen, onClick }) => (
  <motion.div
    className="border-b border-white/20 last:border-0"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
  >
    <button onClick={onClick} className="w-full text-left py-5 flex justify-between items-center group transition-all">
      <span className="text-sm md:text-base font-semibold text-gray-800 group-hover:text-green-600 transition-colors pr-4 leading-relaxed">{question}</span>
      <motion.span
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all backdrop-blur-sm"
        style={{ background: isOpen ? "linear-gradient(135deg,#16a34a,#059669)" : "rgba(255,255,255,0.8)", color: isOpen ? "#fff" : "#16a34a", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >{isOpen ? "−" : "+"}</motion.span>
    </button>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="pb-5 text-gray-500 text-sm md:text-base leading-relaxed pl-0 pr-10"
      >{answer}</motion.div>
    )}
  </motion.div>
);

/* ─── Section Label ─── */
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
      style={{ background: "rgba(240,253,244,0.8)", color: "#16a34a", letterSpacing: "0.12em", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
      {children}
    </span>
  </motion.div>
);

/* ─── Glass Card ─── */
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
    >{children}</motion.div>
  );
};

/* ─── Course Card ─── */
const CourseCard = ({ icon: Icon, name, desc, mode, modules, index }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="backdrop-blur-md rounded-2xl p-6 transition-all duration-300 relative overflow-hidden cursor-pointer"
      style={{
        background: hovered ? "rgba(240,253,244,0.9)" : "rgba(255,255,255,0.8)",
        border: `1.5px solid ${hovered ? "#16a34a" : "rgba(220,252,231,0.8)"}`,
        boxShadow: hovered ? "0 20px 40px rgba(22,163,74,0.15)" : "0 8px 32px rgba(0,0,0,0.08)",
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
      }}
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
        style={{
          width: "46px", height: "46px", borderRadius: "12px",
          background: hovered ? "linear-gradient(135deg,#16a34a,#059669)" : "linear-gradient(135deg,#dcfce7,#bbf7d0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "20px",
          boxShadow: hovered ? "0 4px 14px rgba(22,163,74,0.35)" : "none",
        }}
      >
        <Icon style={{ color: hovered ? "#ffffff" : "#16a34a", fontSize: "19px" }} />
      </motion.div>
      <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#111827", marginBottom: "10px", lineHeight: "1.3", fontFamily: "'Georgia', serif" }}>{name}</h3>
      <p style={{ fontSize: "13.5px", color: "#6b7280", lineHeight: "1.65", flex: 1, margin: 0 }}>{desc}</p>
      <div style={{ marginTop: "22px", borderTop: `1px solid ${hovered ? "rgba(187,247,208,0.8)" : "rgba(240,253,244,0.8)"}`, paddingTop: "16px" }}>
        <Link to="/contact" style={{ fontSize: "13px", color: "#16a34a", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
          Enroll Now <FaArrowRight style={{ fontSize: "11px" }} />
        </Link>
      </div>
    </motion.div>
  );
};

/* ─── PROJECT CARD — redesigned ─── */
const ProjectCard = ({ project, index }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.a
      ref={ref}
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.55, delay: index * 0.12, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          background: "#ffffff",
          border: `1.5px solid ${hovered ? "#16a34a" : "#e5f7ee"}`,
          borderRadius: "20px",
          overflow: "hidden",
          transition: "all 0.3s ease",
          transform: hovered ? "translateY(-6px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 24px 48px rgba(22,163,74,0.14), 0 0 0 1px rgba(22,163,74,0.12)"
            : "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        {/* Image area */}
        <div
          style={{
            position: "relative",
            height: "220px",
            overflow: "hidden",
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          }}
        >
          <img
            src={project.image}
            alt={project.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s ease",
              transform: hovered ? "scale(1.06)" : "scale(1)",
            }}
          />
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: hovered
                ? "linear-gradient(to top, rgba(22,163,74,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)"
                : "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)",
              transition: "background 0.3s ease",
            }}
          />
          {/* Top-right badge */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
              border: "1px solid #d1fae5",
              borderRadius: "999px",
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              letterSpacing: "0.04em",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#16a34a",
                display: "inline-block",
                animation: "pulse 1.5s infinite",
              }}
            />
            Live Project
          </div>
          {/* Bottom-left number */}
          <div
            style={{
              position: "absolute",
              bottom: "14px",
              left: "16px",
              fontSize: "11px",
              fontWeight: "700",
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "0.08em",
              fontFamily: "monospace",
            }}
          >
            0{index + 1} / 04
          </div>
          {/* Hover arrow overlay */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.7 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              bottom: "14px",
              right: "16px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <FaExternalLinkAlt style={{ color: "#16a34a", fontSize: "13px" }} />
          </motion.div>
        </div>

        {/* Content */}
        <div style={{ padding: "22px 22px 20px" }}>
          {/* Tag */}
          <div style={{ marginBottom: "10px" }}>
            <span
              style={{
                display: "inline-block",
                background: hovered ? "#dcfce7" : "#f0fdf4",
                color: "#15803d",
                fontSize: "10.5px",
                fontWeight: "700",
                padding: "3px 10px",
                borderRadius: "999px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: "1px solid #bbf7d0",
                transition: "background 0.2s",
              }}
            >
              {project.tag}
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: "17px",
              fontWeight: "800",
              color: "#111827",
              margin: "0 0 8px",
              lineHeight: "1.3",
              fontFamily: "'Georgia', serif",
              transition: "color 0.2s",
            }}
          >
            {project.name}
          </h3>

          {/* Description */}
          <p
            style={{
              fontSize: "13.5px",
              color: "#6b7280",
              lineHeight: "1.65",
              margin: "0 0 18px",
            }}
          >
            {project.description}
          </p>

          {/* Tech pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
            {project.tech.map((t, i) => (
              <span
                key={i}
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#374151",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "2px 8px",
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Footer row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #f0fdf4",
              paddingTop: "14px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#16a34a",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "gap 0.2s",
              }}
            >
              View Live Demo <FaArrowRight style={{ fontSize: "10px" }} />
            </span>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: hovered ? "linear-gradient(135deg,#16a34a,#059669)" : "#f0fdf4",
                border: `1.5px solid ${hovered ? "#16a34a" : "#d1fae5"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s ease",
              }}
            >
              <FaExternalLinkAlt style={{ fontSize: "11px", color: hovered ? "#fff" : "#16a34a" }} />
            </div>
          </div>
        </div>
      </div>
    </motion.a>
  );
};

/* ─── Main Home ─── */
const Home = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  const extraFaqs = [
    { q: "What is the duration of the Full Stack course?", a: "The course is 6 months long, with self-paced learning and recorded sessions available 24/7." },
    { q: "Will I get a certificate after completion?", a: "Yes, you will receive an industry-recognized certificate upon successful completion of the course and projects." },
    { q: "Do you provide internship opportunities?", a: "We help students get internships with our partner companies based on their performance." },
  ];

  const courses = [
    { icon: FaCode, name: "Full Stack Web Development", desc: "Build responsive, modern full-stack web applications.", mode: "offline / online", modules: 52 },
    { icon: FaMobileAlt, name: "Mobile App Development", desc: "Create native and cross-platform mobile apps for iOS and Android.", mode: "offline / online", modules: 52 },
    { icon: FaShieldAlt, name: "Cyber Security", desc: "Learn cybersecurity fundamentals to protect modern digital systems.", mode: "offline / online", modules: 52 },
    { icon: FaBrain, name: "AI / Machine Learning", desc: "Build intelligent systems using AI and machine learning concepts.", mode: "offline / online", modules: 52 },
    { icon: FaGamepad, name: "Game Development", desc: "Design and develop interactive games using modern engines.", mode: "offline / online", modules: 52 },
    { icon: FaChartBar, name: "Data Science", desc: "Turn data into insights using analytics and machine learning.", mode: "offline / online", modules: 52 },
  ];

  const projects = [
    {
      name: "Zenly — Student Wellbeing Platform",
      description: "Connects emotional state to study strategy with mood check-ins, focus sessions, and wellness tracking.",
      link: "https://zenly-1-frontend.onrender.com/",
      image: zenlyImg,
      tag: "Web App",
      tech: ["React", "Node.js", "MongoDB", "Tailwind"],
    },
    {
      name: "Porsche — Premium Landing Page",
      description: "Luxury automotive brand showcase with stunning animations and responsive design built from scratch.",
      link: "https://porsche-lac.vercel.app/",
      image: porscheImg,
      tag: "Landing Page",
      tech: ["React", "Framer Motion", "CSS3"],
    },
    {
      name: "Hostel Management System",
      description: "Complete platform for managing student hostels, room allocation, attendance, and fees.",
      link: "https://hostel-management-system-frontend-ten.vercel.app/",
      image: hostelImg,
      tag: "Full Stack",
      tech: ["MERN Stack", "JWT", "REST API"],
    },
    {
      name: "BMW — Premium Car Showcase",
      description: "Elegant automotive landing page with smooth animations and fully responsive layout.",
      link: "https://bmwcar.vercel.app/",
      image: bmwImg,
      tag: "Landing Page",
      tech: ["HTML", "CSS", "JavaScript"],
    },
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
  };

  return (
    <main className="font-sans overflow-x-hidden bg-gradient-to-br from-white via-green-50/30 to-white">
      {/* Background blur orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-15 -translate-x-1/2"></div>
      </div>

      {/* ── HERO ── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative py-20 md:py-28 overflow-hidden"
        style={{ background: "linear-gradient(160deg, rgba(240,253,244,0.6) 0%, rgba(255,255,255,0.8) 50%, rgba(236,253,245,0.6) 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12">
            <motion.div
              className="flex-1 text-center md:text-left"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]"
                style={{ fontFamily: "'Georgia', serif" }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Zero Experience to{" "}
                <span style={styles.gradientText}>Hero Developer</span>
              </motion.h1>
              <motion.p
                className="text-base md:text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Experience is the best teacher. Master full stack development through structured learning, real-world projects, and expert mentorship.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all duration-300 backdrop-blur-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}>
                    Enroll Now <FaArrowRight className="text-sm" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/about" className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-green-700 bg-white/80 backdrop-blur-sm border border-green-200 hover:border-green-400 transition-all duration-300">
                    Learn More
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
            <motion.div
              className="flex-1 flex justify-center"
              initial={{ x: 50, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl opacity-40" style={{ background: "radial-gradient(circle at 50% 50%,#bbf7d0,transparent 70%)", transform: "scale(1.15)" }} />
                <motion.img src={heroImg} alt="Developer illustration" className="relative rounded-3xl w-3/4 md:w-full max-w-md" style={{ boxShadow: "0 24px 80px rgba(22,163,74,0.2), 0 8px 32px rgba(0,0,0,0.1)" }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── VIDEO + DESCRIPTION ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <motion.div className="w-full lg:w-1/2" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <GlassCard className="overflow-hidden p-0">
                <div className="relative pb-[70.25%] h-0 bg-gray-900 rounded-2xl overflow-hidden">
                  <video className="absolute top-0 left-0 w-full h-full object-cover" controls autoPlay muted loop>
                    <source src="/videos/mueen-sir.mp4" type="video/mp4" />
                  </video>
                </div>
              </GlassCard>
            </motion.div>
            <motion.div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight" style={{ fontFamily: "'Georgia', serif" }}>
                Full Stack Development{" "}<span style={styles.gradientText}>Course</span>
              </h3>
              <p className="text-gray-500 text-base leading-relaxed">
                Learn at your own pace with our comprehensive self-paced Full Stack program. Master frontend (React, Tailwind) and backend (Node.js, Express, MongoDB) through structured modules and real-world projects.
              </p>
              <ul className="space-y-3 text-gray-700">
                {["100% self-paced learning – study anytime, anywhere", "Build 5 portfolio-worthy projects (MERN stack)", "Resume building, mock interviews & job referrals", "Certificate upon completion & lifetime access"].map((item, i) => (
                  <motion.li key={i} className="flex items-center gap-3 justify-center lg:justify-start" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }} viewport={{ once: true }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#dcfce7" }}><FaCheckCircle className="text-green-600 text-xs" /></span>
                    <span className="text-sm text-gray-600">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="pt-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/contact" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all duration-300 backdrop-blur-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}>
                    Enroll Now <FaArrowRight className="text-sm" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── COURSES ── */}
      <section className="py-20 md:py-28" style={{ background: "linear-gradient(160deg, rgba(240,253,244,0.4) 0%, rgba(255,255,255,0.8) 60%, rgba(236,253,245,0.4) 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-sm" style={{ background: "rgba(220,252,231,0.8)", color: "#15803d", fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", border: "1px solid rgba(187,247,208,0.8)" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              Our Programs
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
              Explore Our <span style={styles.gradientText}>Courses</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Industry-aligned programs with AI-integrated curriculum and hands-on project experience.</p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, i) => <CourseCard key={i} {...course} index={i} />)}
          </motion.div>
        </div>
      </section>

      {/* ── REAL PROJECTS — redesigned ── */}
      <section className="py-20 md:py-28 relative" style={{ background: "#f8fffe" }}>
        {/* Subtle top accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, transparent, #16a34a, #059669, #0d9488, transparent)" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: "rgba(220,252,231,0.7)", border: "1px solid #bbf7d0" }}>
              <FaLaptopCode style={{ color: "#16a34a", fontSize: "13px" }} />
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#15803d", textTransform: "uppercase", letterSpacing: "0.1em" }}>Student Builds</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Georgia', serif" }}>
              Real Projects.{" "}
              <span style={styles.gradientText}>Real Impact.</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
              Every project below was built by our students — live, deployed, and production-ready.
            </p>
          </motion.div>

          {/* Project grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, idx) => (
              <ProjectCard key={idx} project={project} index={idx} />
            ))}
          </div>

          {/* Bottom CTA hint */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>
              You could be building projects like these.{" "}
              <Link to="/contact" style={{ color: "#16a34a", fontWeight: "700", textDecoration: "none" }}>
                Start today →
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── LEARNING JOURNEY ── */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/80 backdrop-blur-sm border border-green-200 mb-6">
              <FaPlay className="text-green-600 text-sm" />
              <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">How It Works</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Georgia', serif" }}>
              Your <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Learning Journey</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">From zero to hero in 6 months with our proven methodology</p>
          </motion.div>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-green-300 to-emerald-300 hidden md:block"></div>
            {[
              { step: "01", title: "Learn Fundamentals", desc: "Master HTML, CSS, JavaScript, and core programming concepts with hands-on exercises.", duration: "6 weeks + assignments", dir: "left" },
              { step: "02", title: "Master Frameworks", desc: "Build dynamic applications with React, Next.js, and modern frontend tools.", duration: "6 weeks + projects", dir: "right" },
              { step: "03", title: "Backend & Database", desc: "Create APIs, manage databases, and handle authentication with Node.js and Express.", duration: "6 weeks + APIs", dir: "left" },
              { step: "04", title: "Build Portfolio & Get Hired", desc: "Create 3 capstone projects, prepare for interviews, and land your dream job.", duration: "3 major projects", dir: "right" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: s.dir === "left" ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className={`flex flex-col md:flex-row items-center gap-8 ${i < 3 ? "mb-16" : ""}`}>
                {s.dir === "left" ? (
                  <>
                    <div className="md:w-1/2 md:text-right order-2 md:order-1">
                      <GlassCard className="p-6 text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs mb-3"><span>STEP {s.step}</span></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{s.title}</h3>
                        <p className="text-gray-500 text-sm">{s.desc}</p>
                        <div className="mt-3 text-xs text-green-600">{s.duration}</div>
                      </GlassCard>
                    </div>
                    <div className="md:w-16 flex justify-center order-1 md:order-2">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg z-10">{i + 1}</div>
                    </div>
                    <div className="md:w-1/2 order-3"></div>
                  </>
                ) : (
                  <>
                    <div className="md:w-1/2 order-3 md:order-1"></div>
                    <div className="md:w-16 flex justify-center order-2">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg z-10">{i + 1}</div>
                    </div>
                    <div className="md:w-1/2 md:text-left order-1 md:order-3">
                      <GlassCard className="p-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs mb-3"><span>STEP {s.step}</span></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{s.title}</h3>
                        <p className="text-gray-500 text-sm">{s.desc}</p>
                        <div className="mt-3 text-xs text-green-600">{s.duration}</div>
                      </GlassCard>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOURNEY ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div className="flex-1" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <GlassCard className="overflow-hidden p-0">
                <img src={journeyImg} alt="Journey" className="w-full h-full object-cover" />
              </GlassCard>
            </motion.div>
            <motion.div className="flex-1 text-center md:text-left" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
              <SectionLabel>Your Path</SectionLabel>
              <h2 className="text-2xl md:text-4xl font-extrabold mb-5 text-gray-900 leading-tight" style={{ fontFamily: "'Georgia', serif" }}>
                Start Your Developer Journey Today
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-8">Take the first step toward becoming a professional developer. Learn modern technologies, build real-world projects, and gain the skills needed for a successful career.</p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/contact" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all duration-300 backdrop-blur-sm" style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}>
                  Start Now <FaArrowRight className="text-sm" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHY ZIAS ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div className="flex-1 text-center md:text-left" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <SectionLabel>Our Advantage</SectionLabel>
              <h2 className="text-2xl md:text-4xl font-extrabold mb-8 text-gray-900 leading-tight" style={{ fontFamily: "'Georgia', serif" }}>Why Choose ZIAS</h2>
              <ul className="space-y-4">
                {[
                  { icon: FaCheckCircle, text: "Real-world project experience that employers value." },
                  { icon: FaUsers, text: "Career-ready skill development with industry mentors." },
                  { icon: FaGlobe, text: "Mentor guidance and continuous feedback loops." },
                  { icon: FaLightbulb, text: "Industry-focused curriculum updated regularly." },
                ].map(({ icon: Icon, text }, i) => (
                  <motion.li key={i} className="flex items-start gap-4" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}>
                    <span className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5" style={{ background: "linear-gradient(135deg,#dcfce7,#d1fae5)" }}>
                      <Icon className="text-green-600 text-sm" />
                    </span>
                    <span className="text-gray-600 text-sm md:text-base leading-relaxed pt-1.5">{text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div className="flex-1" initial={{ opacity: 0, x: 50, scale: 0.95 }} whileInView={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <GlassCard className="overflow-hidden p-0">
                <img src={zias} alt="ZIAS" className="w-full" />
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 md:py-24" style={{ background: "#f8fafc" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel>Student Stories</SectionLabel>
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-12 text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>What Our Students Say</h2>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Udaifa K.K", role: "Full Stack Developer", text: "The hands-on projects and mentor support helped me land a job at a top tech company. Highly recommended!", initial: "U" },
              { name: "Hasna C.H", role: "Frontend Developer", text: "ZIAS transformed my career. The curriculum is industry-relevant and the community is very supportive.", initial: "H" },
              { name: "Wafa Fathima C.K", role: "Backend Developer", text: "Best decision ever! The real-world projects gave me the confidence to build complex applications.", initial: "W" },
            ].map((t, i) => (
              <motion.div key={i} variants={fadeInUp} className="backdrop-blur-md bg-white/60 rounded-2xl p-6 transition-all duration-300 border border-white/40 shadow-lg hover:shadow-xl">
                <FaQuoteLeft className="text-green-300 text-xl mb-4" />
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-green-700 font-extrabold text-base flex-shrink-0" style={{ background: "linear-gradient(135deg,#dcfce7,#bbf7d0)" }}>{t.initial}</div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                  <div className="ml-auto flex text-yellow-400 text-xs gap-0.5">{[...Array(5)].map((_, i) => <FaStar key={i} />)}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-12 text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>Frequently Asked Questions</h2>
          <GlassCard className="p-6 md:p-8">
            {[
              { q: "What are the prerequisites for the Full Stack course?", a: "Basic knowledge of any programming language is helpful but not mandatory. We start from fundamentals." },
              { q: "Is the course online or offline?", a: "All courses are delivered online with self-paced learning materials available 24/7." },
              { q: "Do you provide placement assistance?", a: "Yes, we offer resume building, mock interviews, and job referrals to our students." },
              { q: "Can I pay in installments?", a: "Yes, we have flexible payment plans. Contact our support for details." },
              ...extraFaqs,
            ].map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} isOpen={openFaq === i} onClick={() => toggleFaq(i)} />
            ))}
          </GlassCard>
        </div>
      </section>

      {/* ── CTA ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #052e16 0%, #14532d 60%, #166534 100%)" }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle,#4ade80,transparent 70%)", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle,#86efac,transparent 70%)", transform: "translate(-30%,30%)" }} />
        <div className="max-w-3xl mx-auto text-center px-4 relative z-10">
          <motion.span initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.1)", color: "#86efac" }}>
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Join 1,200+ Students
          </motion.span>
          <motion.h2 initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight" style={{ fontFamily: "'Georgia', serif" }}>
            Ready to Become a Hero Developer?
          </motion.h2>
          <motion.p initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} viewport={{ once: true }} className="text-base md:text-lg text-green-200 mb-8 max-w-xl mx-auto leading-relaxed">
            Join thousands of students who have transformed their careers with ZIAS. Your journey starts with one click.
          </motion.p>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} viewport={{ once: true }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-green-900 bg-white hover:bg-green-50 transition-all duration-300 shadow-lg backdrop-blur-sm">
              Enroll Now <FaArrowRight />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </main>
  );
};

export default Home;