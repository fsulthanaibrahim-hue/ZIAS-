import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  FaCode, FaCloud, FaMobileAlt, FaRobot,
  FaComments, FaProjectDiagram, FaUserTie,
  FaBook, FaBriefcase, FaArrowRight,
  FaCrown
} from "react-icons/fa";
import Footer from "../components/Footer";
import coursesImg from "../assets/images/coursesImg.png";

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

/* ─── Course Card with Glass Effect and Hover Animation ─── */
const CourseCard = ({ Icon, title, desc, index }) => {
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
        {title}
      </h3>

      <p style={{ fontSize: "13.5px", color: "#6b7280", lineHeight: "1.65", flex: 1, margin: 0 }}>
        {desc}
      </p>
    </motion.div>
  );
};

/* ─── Highlight Card for Course Highlights ─── */
const HighlightCard = ({ icon: Icon, title, desc, index }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="backdrop-blur-md rounded-2xl p-5 transition-all duration-300 text-center"
      style={{
        background: hovered ? "rgba(240,253,244,0.9)" : "rgba(255,255,255,0.8)",
        border: `1px solid ${hovered ? "#16a34a" : "rgba(220,252,231,0.8)"}`,
        boxShadow: hovered
          ? "0 20px 40px rgba(22,163,74,0.1)"
          : "0 8px 32px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
      }}
    >
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
          margin: "0 auto 16px auto",
          transition: "all 0.25s ease",
          boxShadow: hovered ? "0 4px 14px rgba(22,163,74,0.3)" : "none",
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
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
};

const Courses = () => {
  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  // Courses data
  const courses = [
    { Icon: FaCode, title: "Full Stack Development", desc: "Master frontend and backend technologies with modern frameworks like React, Node.js, and MongoDB." },
    { Icon: FaRobot, title: "Data Science & AI", desc: "Analyze data, build ML models, and implement AI solutions using Python, TensorFlow, and more." },
    { Icon: FaMobileAlt, title: "Mobile App Development", desc: "Create beautiful cross-platform mobile apps with Flutter and React Native for iOS and Android." },
    { Icon: FaCloud, title: "DevOps & Cloud", desc: "Learn cloud deployment, CI/CD pipelines, Docker, Kubernetes, and automation skills." },
  ];

  // Highlights data
  const topHighlights = [
    { icon: FaComments, title: "Communication Skills", desc: "Enhance your teamwork, presentation, and client interaction skills through regular sessions." },
    { icon: FaProjectDiagram, title: "Live Projects", desc: "Work on real-world industry projects for practical experience and portfolio building." },
    { icon: FaUserTie, title: "Mentor Guidance", desc: "Get personalized feedback and mentoring from experienced industry experts." },
  ];

  const bottomHighlights = [
    { icon: FaBook, title: "Structured Curriculum", desc: "Step-by-step learning path from beginner to advanced with regular assessments." },
    { icon: FaBriefcase, title: "Placement Support", desc: "Resume building, mock interviews, job referrals, and career guidance until you get hired." },
  ];

  return (
    <main className="font-sans overflow-x-hidden bg-gradient-to-br from-white via-green-50/30 to-white">
      {/* Background blur circles for glass effect */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-15 -translate-x-1/2"></div>
      </div>

      {/* Hero Section with Glass Effect */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative py-20 md:py-28 overflow-hidden"
        style={{ background: "linear-gradient(160deg, rgba(240,253,244,0.6) 0%, rgba(255,255,255,0.8) 50%, rgba(236,253,245,0.6) 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
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
                Our <span style={styles.gradientText}>Professional Courses</span>
              </motion.h1>
              <motion.p
                className="text-base md:text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Industry-focused programs designed to make you a skilled, job-ready developer. From beginner to advanced levels, learn modern technologies with hands-on projects.
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
                  src={coursesImg}
                  alt="Courses illustration"
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

      {/* Explore Courses Section with Glass Cards */}
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {courses.map((course, i) => (
              <CourseCard key={i} Icon={course.Icon} title={course.title} desc={course.desc} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Course Highlights Section with Glass Cards */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/80 backdrop-blur-sm border border-green-200 mb-6">
              <FaCrown className="text-green-600 text-sm" />
              <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">Key Benefits</span>
            </div>
            <h2
              className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Course{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Highlights
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Key benefits you get from our programs to excel in your career.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {topHighlights.map((highlight, i) => (
              <HighlightCard key={i} icon={highlight.icon} title={highlight.title} desc={highlight.desc} index={i} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {bottomHighlights.map((highlight, i) => (
              <HighlightCard key={i} icon={highlight.icon} title={highlight.title} desc={highlight.desc} index={i + 3} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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

export default Courses;