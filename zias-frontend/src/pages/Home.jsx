import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCheckCircle, FaUsers, FaGlobe, FaLightbulb,
  FaCode, FaLaptopCode, FaServer, FaDatabase,
  FaProjectDiagram, FaChartLine, FaStar,
  FaUserGraduate, FaBriefcase, FaChalkboardTeacher,
  FaQuoteLeft, FaNewspaper, FaCalendarAlt, FaArrowRight
} from "react-icons/fa";
import Footer from "../components/Footer";
import heroImg from "../assets/images/heroImg.png";
import coursesImg from "../assets/images/coursesImg.png";
import certificationsImg from "../assets/images/certification.jpg";
import projectsImg from "../assets/images/projects.jpg";
import journeyImg from "../assets/images/journeyImg.jpg";
import zias from "../assets/images/zias.png";

// Import your custom images for BBA and MCA
import pythonImg from "../assets/images/Python.png";
import mernImg from "../assets/images/MERN.png";

/* ─── Tailwind custom classes via inline styles ─── */
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

/* ─── FAQ Item ─── */
const FaqItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-gray-100 last:border-0">
    <button
      onClick={onClick}
      className="w-full text-left py-5 flex justify-between items-center group transition-all"
    >
      <span className="text-sm md:text-base font-semibold text-gray-800 group-hover:text-green-600 transition-colors pr-4 leading-relaxed">
        {question}
      </span>
      <span
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all"
        style={{
          background: isOpen ? "linear-gradient(135deg,#16a34a,#059669)" : "#f0fdf4",
          color: isOpen ? "#fff" : "#16a34a",
        }}
      >
        {isOpen ? "−" : "+"}
      </span>
    </button>
    {isOpen && (
      <div className="pb-5 text-gray-500 text-sm md:text-base leading-relaxed pl-0 pr-10">
        {answer}
      </div>
    )}
  </div>
);

/* ─── Feature Card ─── */
const FeatureCard = ({ icon: Icon, title, description }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="bg-white p-6 md:p-8 rounded-2xl transition-all duration-300 text-center cursor-default"
      style={hovered ? styles.cardHoverGlow : styles.cardGlow}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 transition-transform duration-300"
        style={{
          background: "linear-gradient(135deg,#dcfce7,#d1fae5)",
          transform: hovered ? "scale(1.1) rotate(-3deg)" : "scale(1)",
        }}
      >
        {Icon && <Icon className="text-green-600 text-2xl" />}
      </div>
      <h3 className="text-base md:text-lg font-bold mb-2 text-gray-900 tracking-tight">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

/* ─── Section Label ─── */
const SectionLabel = ({ children }) => (
  <div className="flex justify-center mb-4">
    <span
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
      style={{ background: "#f0fdf4", color: "#16a34a", letterSpacing: "0.12em" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      {children}
    </span>
  </div>
);

/* ─── Main Home Component ─── */
const Home = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  const extraFaqs = [
    { q: "What is the duration of the Full Stack course?", a: "The course is 6 months long, with self-paced learning and recorded sessions available 24/7." },
    { q: "Will I get a certificate after completion?", a: "Yes, you will receive an industry-recognized certificate upon successful completion of the course and projects." },
    { q: "Is there any EMI option available?", a: "Yes, we have flexible EMI plans. Contact our admission team for details." },
    { q: "Do you provide internship opportunities?", a: "We help students get internships with our partner companies based on their performance." },
  ];

  const updates = [
    { title: "New Batch Starting June 1st", date: "May 15, 2025", desc: "Enroll now for the upcoming Full Stack batch and start your developer journey." },
    { title: "Guest Lecture on AI", date: "May 20, 2025", desc: "Join our industry expert for an insightful session on AI in modern web development." },
    { title: "Hackathon 2025", date: "June 10, 2025", desc: "Participate in our annual coding hackathon and win exciting prizes." },
  ];

  return (
    <main className="font-sans overflow-x-hidden bg-white">

      {/* ── HERO ── */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #f0fdf4 0%, #ffffff 50%, #ecfdf5 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Zero Experience to{" "}
                <span style={styles.gradientText}>Hero Developer</span>
              </h1>
              <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
                Experience is the best teacher. Master full stack development through structured learning, real-world projects, and expert mentorship.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:opacity-90 hover:translate-y-[-1px]"
                  style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}
                >
                  Enroll Now <FaArrowRight className="text-sm" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-green-700 bg-white border border-green-200 hover:border-green-400 transition-all duration-300"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-3xl opacity-40"
                  style={{ background: "radial-gradient(circle at 50% 50%,#bbf7d0,transparent 70%)", transform: "scale(1.15)" }}
                />
                <img
                  src={heroImg}
                  alt="Developer illustration"
                  className="relative rounded-3xl w-3/4 md:w-full max-w-md"
                  style={{ boxShadow: "0 24px 80px rgba(22,163,74,0.2), 0 8px 32px rgba(0,0,0,0.1)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO + DESCRIPTION ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-full lg:w-1/2">
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 24px 80px rgba(22,163,74,0.15), 0 8px 32px rgba(0,0,0,0.1)" }}
              >
                <div className="relative pb-[70.25%] h-0 bg-gray-900">
                  <video
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    controls autoPlay muted loop
                  >
                    <source src="/videos/mueen-sir.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
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
                  <li key={i} className="flex items-center gap-3 justify-center lg:justify-start">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "#dcfce7" }}
                    >
                      <FaCheckCircle className="text-green-600 text-xs" />
                    </span>
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:opacity-90 hover:translate-y-[-1px]"
                  style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}
                >
                  Enroll Now <FaArrowRight className="text-sm" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAMS (6 cards) ── */}
      <section className="py-16 md:py-24" style={{ background: "#f8fafc" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-2xl md:text-4xl font-extrabold text-center mb-12 text-gray-900"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Explore Our Programs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { Icon: FaCode, name: "Fullstack Development", desc: "Learn both frontend and backend technologies to become a complete developer." },
              { Icon: FaLaptopCode, name: "Frontend Development", desc: "Build responsive and interactive user interfaces using modern tools." },
              { Icon: FaServer, name: "Backend Development", desc: "Create powerful APIs and handle server-side logic efficiently." },
              { Icon: FaDatabase, name: "Database Management", desc: "Learn to design and manage databases like PostgreSQL and MySQL." },
              { Icon: FaProjectDiagram, name: "Project Development", desc: "Work on real-world projects to gain practical experience." },
              { Icon: FaChartLine, name: "Career Preparation", desc: "Get ready for jobs with interview prep, resume building, and guidance." },
            ].map((p, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-6 transition-all duration-300 cursor-default"
                style={styles.cardGlow}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHoverGlow)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cardGlow)}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: "linear-gradient(135deg,#dcfce7,#d1fae5)" }}
                >
                  <p.Icon className="text-green-600 text-xl" />
                </div>
                <h3 className="text-base font-bold mb-2 text-gray-900">{p.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SKILL-INTEGRATED DEGREE PROGRAMS (BIGGER SQUARE IMAGES) ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel>Our Courses</SectionLabel>
          <h2
            className="text-2xl md:text-4xl font-extrabold text-center mb-12 text-gray-900"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Skill-Integrated Degree Programs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* BCA Card */}
            <div
              className="rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center relative"
              style={styles.cardGlow}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHoverGlow)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cardGlow)}
            >
              <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                01
              </div>
              <div className="flex justify-center mb-4">
                <img src={coursesImg} alt="BCA" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl shadow-md" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Georgia', serif" }}>BCA</h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4 inline-block">FullStack Development</span>
              <div className="mt-2 mb-6 w-full text-left">
                <p className="text-sm font-semibold text-gray-700 mb-3">Integrated with</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600"><FaCheckCircle className="text-green-500 text-xs" /> Full Stack Development</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600"><FaCheckCircle className="text-green-500 text-xs" /> Mobile App Development</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600"><FaCheckCircle className="text-green-500 text-xs" /> Data Analytics</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600"><FaCheckCircle className="text-green-500 text-xs" /> AI & ML</li>
                </ul>
              </div>
              <div className="mt-auto pt-6">
                <Link to="/contact" className="inline-flex items-center gap-2 text-green-600 font-bold text-sm hover:gap-3 transition-all">
                  Apply Now <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>

            {/* BBA Card */}
            <div
              className="rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center relative"
              style={styles.cardGlow}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHoverGlow)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cardGlow)}
            >
              <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                02
              </div>
              <div className="flex justify-center mb-4">
                <img src={pythonImg} alt="BBA" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl shadow-md" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Georgia', serif" }}>Python Development</h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4 inline-block">Bachelor of Business Administration</span>
              <div className="mt-2 mb-6 w-full text-left">
                <p className="text-sm font-semibold text-gray-700 mb-3">Integrated with</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600"><FaCheckCircle className="text-green-500 text-xs" /> Digital Marketing</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600"><FaCheckCircle className="text-green-500 text-xs" /> Creative Visual Media</li>
                </ul>
              </div>
              <div className="mt-auto pt-6">
                <Link to="/contact" className="inline-flex items-center gap-2 text-green-600 font-bold text-sm hover:gap-3 transition-all">
                  Apply Now <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>

            {/* MCA Card */}
            <div
              className="rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center relative"
              style={styles.cardGlow}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHoverGlow)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cardGlow)}
            >
              <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                03
              </div>
              <div className="flex justify-center mb-4">
                <img src={mernImg} alt="MCA" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl shadow-md" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Georgia', serif" }}>MERNStack Development</h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 mb-4 inline-block">Master of Computer Applications</span>
              <div className="mt-2 mb-6 w-full text-left">
                <p className="text-sm font-semibold text-gray-700 mb-3">Integrated with</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600"><FaCheckCircle className="text-green-500 text-xs" /> Full Stack Development</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600"><FaCheckCircle className="text-green-500 text-xs" /> Mobile App Development</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600"><FaCheckCircle className="text-green-500 text-xs" /> Data Analytics</li>
                  <li className="flex items-center gap-2 text-sm text-gray-600"><FaCheckCircle className="text-green-500 text-xs" /> AI & ML</li>
                </ul>
              </div>
              <div className="mt-auto pt-6">
                <Link to="/contact" className="inline-flex items-center gap-2 text-green-600 font-bold text-sm hover:gap-3 transition-all">
                  Apply Now <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── JOURNEY ── */}
      <section className="py-16 md:py-24" style={{ background: "#f8fafc" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="relative rounded-3xl overflow-hidden" style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.12)" }}>
                <img src={journeyImg} alt="Journey" className="w-full h-full object-cover" />
                <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(to top right, rgba(22,163,74,0.15), transparent)" }} />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
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
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}
              >
                Start Now <FaArrowRight className="text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel>Student Stories</SectionLabel>
          <h2
            className="text-2xl md:text-4xl font-extrabold text-center mb-12 text-gray-900"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            What Our Students Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Udaifa K.K", role: "Full Stack Developer", text: "The hands-on projects and mentor support helped me land a job at a top tech company. Highly recommended!", initial: "U" },
              { name: "Hasna C.H", role: "Frontend Developer", text: "ZIAS transformed my career. The curriculum is industry-relevant and the community is very supportive.", initial: "H" },
              { name: "Wafa Fathima C.K", role: "Backend Developer", text: "Best decision ever! The real-world projects gave me the confidence to build complex applications.", initial: "W" },
            ].map((t, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 transition-all duration-300"
                style={styles.cardGlow}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHoverGlow)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cardGlow)}
              >
                <FaQuoteLeft className="text-green-300 text-xl mb-4" />
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-green-700 font-extrabold text-base flex-shrink-0"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ZIAS ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
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
                  <li key={i} className="flex items-start gap-4">
                    <span
                      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                      style={{ background: "linear-gradient(135deg,#dcfce7,#d1fae5)" }}
                    >
                      <Icon className="text-green-600 text-sm" />
                    </span>
                    <span className="text-gray-600 text-sm md:text-base leading-relaxed pt-1.5">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1">
              <div className="relative rounded-3xl overflow-hidden" style={{ boxShadow: "0 24px 60px rgba(22,163,74,0.15)" }}>
                <img src={zias} alt="ZIAS" className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWS & UPDATES ── */}
      <section className="py-16 md:py-24" style={{ background: "#f8fafc" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel>Latest</SectionLabel>
          <h2
            className="text-2xl md:text-4xl font-extrabold text-center mb-12 text-gray-900 flex items-center justify-center gap-3"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            <FaNewspaper className="text-green-600 text-2xl" /> News & Updates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {updates.map((update, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden transition-all duration-300 group"
                style={styles.cardGlow}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHoverGlow)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cardGlow)}
              >
                <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#16a34a,#059669,#0d9488)" }} />
                <div className="p-6">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
                    <FaCalendarAlt className="text-green-500" />
                    <span>{update.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">{update.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">{update.desc}</p>
                  <Link
                    to="/news"
                    className="inline-flex items-center gap-1.5 text-green-600 text-sm font-semibold hover:gap-2.5 transition-all"
                  >
                    Read more <FaArrowRight className="text-xs" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel>FAQ</SectionLabel>
          <h2
            className="text-2xl md:text-4xl font-extrabold text-center mb-12 text-gray-900"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Frequently Asked Questions
          </h2>
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{ border: "1px solid rgba(22,163,74,0.12)", background: "#fafffe" }}
          >
            {[
              { q: "What are the prerequisites for the Full Stack course?", a: "Basic knowledge of any programming language is helpful but not mandatory. We start from fundamentals." },
              { q: "Is the course online or offline?", a: "All courses are delivered online with self-paced learning materials available 24/7." },
              { q: "Do you provide placement assistance?", a: "Yes, we offer resume building, mock interviews, and job referrals to our students." },
              { q: "Can I pay in installments?", a: "Yes, we have flexible payment plans. Contact our support for details." },
              ...extraFaqs,
            ].map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} isOpen={openFaq === i} onClick={() => toggleFaq(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
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
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
            style={{ background: "rgba(255,255,255,0.1)", color: "#86efac" }}
          >
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Join 1,200+ Students
          </span>
          <h2
            className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Ready to Become a Hero Developer?
          </h2>
          <p className="text-base md:text-lg text-green-200 mb-8 max-w-xl mx-auto leading-relaxed">
            Join thousands of students who have transformed their careers with ZIAS. Your journey starts with one click.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-green-900 bg-white hover:bg-green-50 transition-all duration-300 hover:translate-y-[-2px]"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
          >
            Enroll Now <FaArrowRight />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Home;