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
  FaTerminal, FaLayerGroup, FaRocket as FaRocketIcon, FaAtom, FaCrown,
  FaClock, FaLaptopCode, FaCertificate, FaBuilding, FaHandshake,
  FaPlay, FaUserGraduate, FaTrophy, FaHeart, FaRegSmile, FaThumbsUp
} from "react-icons/fa";
import Footer from "../components/Footer";
import heroImg from "../assets/images/heroImg.png";
import coursesImg from "../assets/images/coursesImg.png";
import journeyImg from "../assets/images/journeyImg.jpg";
import zias from "../assets/images/zias.png";

// Import your project images
import porscheImg from "../assets/images/Porsche.png";
import zenlyImg from "../assets/images/Zenly.png";
import hostelImg from "../assets/images/ilham.png";
import bmwImg from "../assets/images/BMW.png";

/* ─── LIGHT GREEN & WHITE COLOR THEME WITH GLASS EFFECTS ─── */
const theme = {
  primary: "#16a34a",
  primaryLight: "#22c55e",
  primaryDark: "#15803d",
  secondary: "#059669",
  accent: "#0d9488",
  gradientStart: "#16a34a",
  gradientMid: "#059669", 
  gradientEnd: "#0d9488",
};

/* ─── Shared styles ─── */
const styles = {
  gradientText: {
    background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientMid} 50%, ${theme.gradientEnd} 100%)`,
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
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const increment = target / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return <span ref={ref}>{count}</span>;
};

/* ─── FAQ Item with Glass Effect ─── */
const FaqItem = ({ question, answer, isOpen, onClick }) => (
  <motion.div 
    className="border-b border-white/20 last:border-0"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
  >
    <button
      onClick={onClick}
      className="w-full text-left py-5 flex justify-between items-center group transition-all"
    >
      <span className="text-sm md:text-base font-semibold text-gray-800 group-hover:text-green-600 transition-colors pr-4 leading-relaxed">
        {question}
      </span>
      <motion.span
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all backdrop-blur-sm"
        style={{
          background: isOpen ? `linear-gradient(135deg,${theme.gradientStart},${theme.gradientEnd})` : "rgba(255,255,255,0.8)",
          color: isOpen ? "#fff" : theme.gradientStart,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isOpen ? "−" : "+"}
      </motion.span>
    </button>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="pb-5 text-gray-500 text-sm md:text-base leading-relaxed pl-0 pr-10"
      >
        {answer}
      </motion.div>
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
      style={{ background: "rgba(240,253,244,0.8)", color: theme.gradientStart, letterSpacing: "0.12em", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
      {children}
    </span>
  </motion.div>
);

/* ─── Glass Card Component ─── */
const GlassCard = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
      transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
      className={`backdrop-blur-md bg-white/70 rounded-2xl border border-white/30 shadow-xl ${className}`}
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.02)" }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      {children}
    </motion.div>
  );
};

/* ─── Course Card with Glass Effect ─── */
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
        boxShadow: hovered
          ? "0 20px 40px rgba(22,163,74,0.15), 0 0 0 1px rgba(22,163,74,0.2)"
          : "0 8px 32px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.02)",
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
      }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-30 pointer-events-none"
        style={{ background: hovered ? "radial-gradient(circle, #16a34a, transparent)" : "none" }}
      />
      

      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "12px",
          background: hovered
            ? "linear-gradient(135deg,#16a34a,#059669)"
            : "linear-gradient(135deg,#dcfce7,#bbf7d0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          transition: "all 0.25s ease",
          boxShadow: hovered ? "0 4px 14px rgba(22,163,74,0.35)" : "none",
        }}
      >
        <Icon
          style={{
            color: hovered ? "#ffffff" : "#16a34a",
            fontSize: "19px",
            transition: "color 0.2s",
          }}
        />
      </motion.div>

     

      <h3
        style={{
          fontSize: "17px",
          fontWeight: "700",
          color: "#111827",
          marginBottom: "10px",
          lineHeight: "1.3",
          fontFamily: "'Georgia', serif",
        }}
      >
        {name}
      </h3>

      <p style={{ fontSize: "13.5px", color: "#6b7280", lineHeight: "1.65", flex: 1, margin: 0 }}>
        {desc}
      </p>

      <div
        style={{
          marginTop: "22px",
          borderTop: `1px solid ${hovered ? "rgba(187,247,208,0.8)" : "rgba(240,253,244,0.8)"}`,
          paddingTop: "16px",
          transition: "border-color 0.2s",
        }}
      >
        <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
        </motion.div>
      </div>
    </motion.div>
  );
};

/* ─── Main Home Component ─── */
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

  // Project data with actual images from your assets (fixed - removed tags and tech arrays)
  const projects = [
    {
      name: "Zenly — Student Wellbeing Platform",
      description: "Connects emotional state to study strategy with mood check-ins, focus sessions, and wellness tracking.",
      link: "https://zenly-1-frontend.onrender.com/",
      image: zenlyImg,
    },
    {
      name: "Porsche — Premium Landing Page",
      description: "Luxury automotive brand showcase with stunning animations and responsive design.",
      link: "https://porsche-lac.vercel.app/",
      image: porscheImg,
    },
    {
      name: "Hostel Management System",
      description: "Complete platform for managing student hostels, room allocation, attendance, and fees.",
      link: "https://hostel-management-system-frontend-ten.vercel.app/",
      image: hostelImg,
    },
    {
      name: "BMW — Premium Car Showcase",
      description: "Elegant automotive landing page with smooth animations and responsive layout.",
      link: "https://bmwcar.vercel.app/",
      image: bmwImg,
    }
  ];

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  return (
    <main className="font-sans overflow-x-hidden bg-gradient-to-br from-white via-green-50/30 to-white">
      {/* Background blur circles for glass effect */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-15 -translate-x-1/2"></div>
      </div>

      {/* ── HERO with Glass Effect ── */}
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
                  src={heroImg}
                  alt="Developer illustration"
                  className="relative rounded-3xl w-3/4 md:w-full max-w-md backdrop-blur-sm"
                  style={{ boxShadow: "0 24px 80px rgba(22,163,74,0.2), 0 8px 32px rgba(0,0,0,0.1)" }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── VIDEO + DESCRIPTION with Glass Card ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <GlassCard className="overflow-hidden p-0">
                <div className="relative pb-[70.25%] h-0 bg-gray-900 rounded-2xl overflow-hidden">
                  <video
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    controls autoPlay muted loop
                  >
                    <source src="/videos/mueen-sir.mp4" type="video/mp4" />
                  </video>
                </div>
              </GlassCard>
            </motion.div>
            <motion.div 
              className="w-full lg:w-1/2 space-y-6 text-center lg:text-left"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3
                className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Full Stack Development{" "}
                <span style={styles.gradientText}>Course</span>
              </h3>
              <p className="text-gray-500 text-base leading-relaxed">
                Learn at your own pace with our comprehensive self-paced Full Stack program. Master frontend (React, Tailwind) and backend (Node.js, Express, MongoDB) through structured modules and real-world projects.
              </p>
              <ul className="space-y-3 text-gray-700">
                {[
                  "100% self-paced learning – study anytime, anywhere",
                  "Build 5 portfolio-worthy projects (MERN stack)",
                  "Resume building, mock interviews & job referrals",
                  "Certificate upon completion & lifetime access",
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-center gap-3 justify-center lg:justify-start"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center backdrop-blur-sm"
                      style={{ background: "#dcfce7" }}
                    >
                      <FaCheckCircle className="text-green-600 text-xs" />
                    </span>
                    <span className="text-sm text-gray-600">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="pt-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all duration-300 backdrop-blur-sm"
                    style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}
                  >
                    Enroll Now <FaArrowRight className="text-sm" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── EXPLORE OUR COURSES with Glass Cards ── */}
      <section
        className="py-20 md:py-28"
        style={{ background: "linear-gradient(160deg, rgba(240,253,244,0.4) 0%, rgba(255,255,255,0.8) 60%, rgba(236,253,245,0.4) 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-sm"
              style={{
                background: "rgba(220,252,231,0.8)",
                color: "#15803d",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "1px solid rgba(187,247,208,0.8)",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              Our Programs
            </span>
            <h2
              className="text-3xl md:text-5xl font-bold mt-4 text-gray-900"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Explore Our{" "}
              <span style={styles.gradientText}>Courses</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              Industry-aligned programs with AI-integrated curriculum and hands-on project experience.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {courses.map((course, i) => (
              <CourseCard key={i} {...course} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TECH SHOWCASE with Actual Images (Fixed - No Live Demo Badge) ── */}
      <section className="py-20 md:py-28 relative" style={{ background: "#f8fafc" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/80 backdrop-blur-sm border border-green-200 mb-6">
              <FaLaptopCode className="text-green-600 text-sm" />
              <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">Live Projects</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Real Projects.{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Real Impact.
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Click on any project to explore live demo — built by our students
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, idx) => (
              <motion.a
                key={idx}
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group relative cursor-pointer block no-underline"
              >
                <GlassCard className="overflow-hidden p-0 hover:shadow-2xl transition-all duration-300">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-2/5 relative h-64 md:h-auto overflow-hidden bg-gray-200">
                      <img 
                        src={project.image} 
                        alt={project.name}
                        className="w-60 h-50 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                    <div className="md:w-3/5 p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h3>
                      <p className="text-gray-500 text-sm mb-4">{project.description}</p>
                      <div className="inline-flex items-center gap-2 text-green-600 text-sm font-semibold group-hover:gap-3 transition-all">
                        View Live Project <FaArrowRight className="text-xs" />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEARNING JOURNEY (No Images) ── */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/80 backdrop-blur-sm border border-green-200 mb-6">
              <FaPlay className="text-green-600 text-sm" />
              <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">How It Works</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Your{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Learning Journey
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              From zero to hero in 6 months with our proven methodology
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-green-300 to-emerald-300 hidden md:block"></div>

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center gap-8 mb-16"
            >
              <div className="md:w-1/2 md:text-right order-2 md:order-1">
                <GlassCard className="p-6 text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs mb-3">
                    <span>STEP 01</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Learn Fundamentals</h3>
                  <p className="text-gray-500 text-sm">Master HTML, CSS, JavaScript, and core programming concepts with hands-on exercises.</p>
                  <div className="mt-3 text-xs text-green-600">6 weeks + assignments</div>
                </GlassCard>
              </div>
              <div className="md:w-16 flex justify-center order-1 md:order-2">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg z-10">1</div>
              </div>
              <div className="md:w-1/2 order-3"></div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center gap-8 mb-16"
            >
              <div className="md:w-1/2 order-3 md:order-1"></div>
              <div className="md:w-16 flex justify-center order-2">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg z-10">2</div>
              </div>
              <div className="md:w-1/2 md:text-left order-1 md:order-3">
                <GlassCard className="p-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs mb-3">
                    <span>STEP 02</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Master Frameworks</h3>
                  <p className="text-gray-500 text-sm">Build dynamic applications with React, Next.js, and modern frontend tools.</p>
                  <div className="mt-3 text-xs text-green-600">6 weeks + projects</div>
                </GlassCard>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center gap-8 mb-16"
            >
              <div className="md:w-1/2 md:text-right order-2 md:order-1">
                <GlassCard className="p-6 text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs mb-3">
                    <span>STEP 03</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Backend & Database</h3>
                  <p className="text-gray-500 text-sm">Create APIs, manage databases, and handle authentication with Node.js and Express.</p>
                  <div className="mt-3 text-xs text-green-600">6 weeks + APIs</div>
                </GlassCard>
              </div>
              <div className="md:w-16 flex justify-center order-1 md:order-2">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg z-10">3</div>
              </div>
              <div className="md:w-1/2 order-3"></div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              <div className="md:w-1/2 order-3 md:order-1"></div>
              <div className="md:w-16 flex justify-center order-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg z-10">4</div>
              </div>
              <div className="md:w-1/2 md:text-left order-1 md:order-3">
                <GlassCard className="p-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs mb-3">
                    <span>STEP 04</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Build Portfolio & Get Hired</h3>
                  <p className="text-gray-500 text-sm">Create 3 capstone projects, prepare for interviews, and land your dream job.</p>
                  <div className="mt-3 text-xs text-green-600">3 major projects</div>
                </GlassCard>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── JOURNEY with Glass Card ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <GlassCard className="overflow-hidden p-0">
                <img src={journeyImg} alt="Journey" className="w-full h-full object-cover" />
                <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(to top right, rgba(22,163,74,0.15), transparent)" }} />
              </GlassCard>
            </motion.div>
            <motion.div 
              className="flex-1 text-center md:text-left"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <SectionLabel>Your Path</SectionLabel>
              <h2
                className="text-2xl md:text-4xl font-extrabold mb-5 text-gray-900 leading-tight"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Start Your Developer Journey Today
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-8">
                Take the first step toward becoming a professional developer. Learn modern technologies, build real-world projects, and gain the skills needed for a successful career.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all duration-300 backdrop-blur-sm"
                  style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}
                >
                  Start Now <FaArrowRight className="text-sm" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ZIAS with Glass Cards ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              className="flex-1 text-center md:text-left"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <SectionLabel>Our Advantage</SectionLabel>
              <h2
                className="text-2xl md:text-4xl font-extrabold mb-8 text-gray-900 leading-tight"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Why Choose ZIAS
              </h2>
              <ul className="space-y-4">
                {[
                  { icon: FaCheckCircle, text: "Real-world project experience that employers value." },
                  { icon: FaUsers, text: "Career-ready skill development with industry mentors." },
                  { icon: FaGlobe, text: "Mentor guidance and continuous feedback loops." },
                  { icon: FaLightbulb, text: "Industry-focused curriculum updated regularly." },
                ].map(({ icon: Icon, text }, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <span
                      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 backdrop-blur-sm"
                      style={{ background: "linear-gradient(135deg,#dcfce7,#d1fae5)" }}
                    >
                      <Icon className="text-green-600 text-sm" />
                    </span>
                    <span className="text-gray-600 text-sm md:text-base leading-relaxed pt-1.5">{text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <GlassCard className="overflow-hidden p-0">
                <img src={zias} alt="ZIAS" className="w-full" />
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS with Glass Cards ── */}
      <section className="py-16 md:py-24" style={{ background: "#f8fafc" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel>Student Stories</SectionLabel>
          <h2
            className="text-2xl md:text-4xl font-extrabold text-center mb-12 text-gray-900"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            What Our Students Say
          </h2>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { name: "Udaifa K.K", role: "Full Stack Developer", text: "The hands-on projects and mentor support helped me land a job at a top tech company. Highly recommended!", initial: "U" },
              { name: "Hasna C.H", role: "Frontend Developer", text: "ZIAS transformed my career. The curriculum is industry-relevant and the community is very supportive.", initial: "H" },
              { name: "Wafa Fathima C.K", role: "Backend Developer", text: "Best decision ever! The real-world projects gave me the confidence to build complex applications.", initial: "W" },
            ].map((t, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="backdrop-blur-md bg-white/60 rounded-2xl p-6 transition-all duration-300 border border-white/40 shadow-lg hover:shadow-xl"
              >
                <FaQuoteLeft className="text-green-300 text-xl mb-4" />
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-green-700 font-extrabold text-base flex-shrink-0 backdrop-blur-sm"
                    style={{ background: "linear-gradient(135deg,#dcfce7,#bbf7d0)" }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                  <div className="ml-auto flex text-yellow-400 text-xs gap-0.5">
                    {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ with Glass Card ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel>FAQ</SectionLabel>
          <h2
            className="text-2xl md:text-4xl font-extrabold text-center mb-12 text-gray-900"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Frequently Asked Questions
          </h2>
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

      {/* ── CTA with Glass Effect ── */}
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
            Join 1,200+ Students
          </motion.span>
          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Ready to Become a Hero Developer?
          </motion.h2>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-base md:text-lg text-green-200 mb-8 max-w-xl mx-auto leading-relaxed"
          >
            Join thousands of students who have transformed their careers with ZIAS. Your journey starts with one click.
          </motion.p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-green-900 bg-white hover:bg-green-50 transition-all duration-300 shadow-lg backdrop-blur-sm"
            >
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