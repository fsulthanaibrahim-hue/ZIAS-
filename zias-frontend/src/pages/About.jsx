import about from "../assets/images/about.jpg";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FaQuoteLeft, FaStar, FaArrowRight, FaCheckCircle, FaUsers, FaBriefcase, FaAward, FaBolt, FaLaptopCode, FaEye } from "react-icons/fa";

/* ─── Matches Home exactly ─── */
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

/* ─── SectionLabel ─── */
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

/* ─── GlassCard ─── */
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
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      {children}
    </motion.div>
  );
};

/* ─── Feature Card ─── */
const FeatureCard = ({ icon: Icon, title, desc, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl p-6 transition-all duration-300 cursor-default"
      style={styles.cardGlow}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHoverGlow)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cardGlow)}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg,#dcfce7,#d1fae5)" }}
      >
        <Icon className="text-green-600 text-xl" />
      </div>
      <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: "'Georgia', serif", fontSize: "17px" }}>
        {title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
};

const About = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  };

  return (
    <main className="font-sans overflow-x-hidden bg-gradient-to-br from-white via-green-50/30 to-white">

      {/* Background blur orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-10 -translate-x-1/2" />
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

            {/* Left */}
            <motion.div
              className="flex-1 text-center md:text-left"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="flex justify-center md:justify-start mb-5"
              >
                <span
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
                  style={{ background: "rgba(220,252,231,0.8)", color: "#15803d", border: "1px solid rgba(187,247,208,0.8)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Our Story
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.08]"
                style={{ fontFamily: "'Georgia', serif" }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
              >
                About{" "}
                <span style={styles.gradientText}>ZIAS</span>
              </motion.h1>

              <motion.p
                className="text-base md:text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.46 }}
              >
                ZIAS is a premier developer training platform that helps students master modern software development through hands-on learning and real-world projects. Our structured programs build strong coding skills and prepare learners for successful careers in technology.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all duration-300 backdrop-blur-sm"
                    style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}
                  >
                    Join Us Today <FaArrowRight className="text-sm" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/courses"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-green-700 bg-white/80 backdrop-blur-sm border border-green-200 hover:border-green-400 transition-all duration-300"
                  >
                    View Courses
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right — Large Image */}
            <motion.div
              className="flex-1 flex justify-center"
              initial={{ x: 50, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative w-full max-w-2xl">
                <div
                  className="absolute inset-0 rounded-3xl opacity-40"
                  style={{ background: "radial-gradient(circle at 50% 50%,#bbf7d0,transparent 70%)", transform: "scale(1.15)" }}
                />
                <motion.img
                  src={about}
                  alt="About ZIAS"
                  className="relative rounded-3xl w-full h-auto"
                  style={{ boxShadow: "0 24px 80px rgba(22,163,74,0.2), 0 8px 32px rgba(0,0,0,0.1)" }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── CAMPUS VIDEO ── */}
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
                <div className="relative bg-black rounded-2xl overflow-hidden" style={{ paddingBottom: "56.25%", height: 0 }}>
                  <video
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    controls autoPlay muted loop
                  >
                    <source src="/videos/cmps short.mp4" type="video/mp4" />
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
              <SectionLabel>Our Campus</SectionLabel>
              <h2
                className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                A World-Class{" "}
                <span style={styles.gradientText}>Learning Environment</span>
              </h2>
              <p className="text-gray-500 text-base leading-relaxed">
                Our campus is designed for innovation and collaboration — equipped with modern labs, smart classrooms, and collaborative zones that bring out the best in every learner.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ZIAS ── */}
      <section
        className="py-16 md:py-24"
        style={{ background: "linear-gradient(160deg, rgba(240,253,244,0.4) 0%, rgba(255,255,255,0.9) 60%, rgba(236,253,245,0.4) 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <SectionLabel>Our Advantage</SectionLabel>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Why Choose <span style={styles.gradientText}>ZIAS?</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-base leading-relaxed">
              What makes our training program stand out from the rest.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: FaLaptopCode, title: "Practical Learning", desc: "Hands-on projects and real-world applications that build your actual skill, not just theory.", delay: 0 },
              { icon: FaUsers, title: "Expert Mentors", desc: "Personalized guidance from experienced industry professionals who've worked at top companies.", delay: 0.1 },
              { icon: FaBriefcase, title: "Placement Support", desc: "Resume building, mock interviews, and active job referrals until you land your first role.", delay: 0.2 },
              { icon: FaAward, title: "Certification", desc: "Industry-recognised certificates that carry real weight with hiring managers and recruiters.", delay: 0.3 },
            ].map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDENT STORIES ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <SectionLabel>Student Stories</SectionLabel>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              What Our Students <span style={styles.gradientText}>Say</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Real experiences from our successful graduates.</p>
          </motion.div>

          {/* Student video - Full width */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12 w-full"
          >
            <GlassCard className="overflow-hidden p-0">
              <div className="relative bg-white rounded-2xl overflow-hidden" style={{ paddingBottom: "56.25%", height: 0 }}>
                <video
                  controls
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ objectFit: "contain", background: "#fff" }}
                >
                  <source src="/videos/wafa's.MP4" type="video/mp4" />
                </video>
              </div>
            </GlassCard>
          </motion.div>

          {/* Testimonial Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Testimonial 1 */}
            <motion.div
              variants={fadeInUp}
              className="backdrop-blur-md bg-white/60 rounded-2xl p-6 transition-all duration-300 border border-white/40 shadow-lg hover:shadow-xl"
            >
              <FaQuoteLeft className="text-green-300 text-xl mb-4" />
              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">
                "The hands-on projects and mentor support helped me land a job at a top tech company. Highly recommended!"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-green-700 font-extrabold text-base flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#dcfce7,#bbf7d0)" }}
                >
                  F
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">Fathimath Sulthana</div>
                  <div className="text-xs text-gray-400">Full Stack Developer</div>
                </div>
                <div className="ml-auto flex text-yellow-400 text-xs gap-0.5">
                  {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                </div>
              </div>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              variants={fadeInUp}
              className="backdrop-blur-md bg-white/60 rounded-2xl p-6 transition-all duration-300 border border-white/40 shadow-lg hover:shadow-xl"
            >
              <FaQuoteLeft className="text-green-300 text-xl mb-4" />
              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">
                "ZIAS transformed my career. The curriculum is industry-relevant and the community is very supportive."
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-green-700 font-extrabold text-base flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#dcfce7,#bbf7d0)" }}
                >
                  S
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">Shaniya</div>
                  <div className="text-xs text-gray-400">Frontend Developer</div>
                </div>
                <div className="ml-auto flex text-yellow-400 text-xs gap-0.5">
                  {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                </div>
              </div>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div
              variants={fadeInUp}
              className="backdrop-blur-md bg-white/60 rounded-2xl p-6 transition-all duration-300 border border-white/40 shadow-lg hover:shadow-xl"
            >
              <FaQuoteLeft className="text-green-300 text-xl mb-4" />
              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">
                "Best decision ever! The real-world projects gave me the confidence to build complex applications."
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-green-700 font-extrabold text-base flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#dcfce7,#bbf7d0)" }}
                >
                  S
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">Saneedha</div>
                  <div className="text-xs text-gray-400">Backend Developer</div>
                </div>
                <div className="ml-auto flex text-yellow-400 text-xs gap-0.5">
                  {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section
        className="py-16 md:py-24"
        style={{ background: "linear-gradient(160deg, rgba(240,253,244,0.4) 0%, rgba(255,255,255,0.9) 60%, rgba(236,253,245,0.4) 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <SectionLabel>Who We Are</SectionLabel>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Mission &{" "}
              <span style={styles.gradientText}>Vision</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 transition-all duration-300"
              style={styles.cardGlow}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHoverGlow)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cardGlow)}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}
              >
                <FaBolt className="text-white text-2xl" />
              </div>
              <h3
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Our Mission
              </h3>
              <p className="text-gray-500 text-base leading-relaxed">
                To empower aspiring developers with practical skills, real-world experience, and career guidance needed to succeed in the technology industry — from complete beginner to job-ready professional.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 transition-all duration-300"
              style={styles.cardGlow}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHoverGlow)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cardGlow)}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "linear-gradient(135deg,#dcfce7,#bbf7d0)" }}
              >
                <FaEye className="text-green-600 text-2xl" />
              </div>
              <h3
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Our Vision
              </h3>
              <p className="text-gray-500 text-base leading-relaxed">
                To create a thriving community of skilled developers who can build modern applications, solve real-world problems, and grow sustainably in the software industry.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#052e16 0%,#14532d 60%,#166534 100%)" }}
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
            Join Our Community
          </motion.span>

          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Ready to Start Your Journey?
          </motion.h2>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-base md:text-lg text-green-200 mb-8 max-w-xl mx-auto leading-relaxed"
          >
            Join ZIAS today and transform your career in tech. Your journey starts with one click.
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
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-green-900 bg-white hover:bg-green-50 transition-all duration-300 shadow-lg"
              >
                Enroll Now <FaArrowRight />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.1)", color: "#86efac", border: "1px solid rgba(134,239,172,0.3)" }}
              >
                View Courses <FaArrowRight />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </main>
  );
};

export default About;