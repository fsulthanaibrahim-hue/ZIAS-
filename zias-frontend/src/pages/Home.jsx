import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCheckCircle, FaUsers, FaGlobe, FaLightbulb,
  FaCode, FaLaptopCode, FaServer, FaDatabase,
  FaProjectDiagram, FaChartLine, FaStar,
  FaUserGraduate, FaBriefcase, FaChalkboardTeacher,
  FaQuoteLeft, FaNewspaper, FaCalendarAlt, FaPlayCircle
} from "react-icons/fa";
import Footer from "../components/Footer";
import heroImg from "../assets/images/heroImg.png";
import coursesImg from "../assets/images/coursesImg.png";
import certificationsImg from "../assets/images/certification.jpg";
import projectsImg from "../assets/images/projects.jpg";
import journeyImg from "../assets/images/journeyImg.jpg";
import zias from "../assets/images/zias.png";

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

const FaqItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-gray-200">
    <button
      onClick={onClick}
      className="w-full text-left py-4 flex justify-between items-center font-semibold text-gray-800 hover:text-green-600 transition"
    >
      <span className="text-sm md:text-base">{question}</span>
      <span className="text-xl ml-2">{isOpen ? "−" : "+"}</span>
    </button>
    {isOpen && <div className="pb-4 text-gray-600 text-sm md:text-base">{answer}</div>}
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-xl transition text-center group">
    <div className="text-green-600 text-3xl md:text-4xl mb-3 md:mb-4 group-hover:scale-110 transition">
      {Icon && <Icon />}
    </div>
    <h3 className="text-lg md:text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 text-sm md:text-base">{description}</p>
  </div>
);

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
    { title: "New Batch Starting June 1st", date: "May 15, 2025", desc: "Enroll now for the upcoming Full Stack batch." },
    { title: "Guest Lecture on AI", date: "May 20, 2025", desc: "Industry expert session on AI in web development." },
    { title: "Hackathon 2025", date: "June 10, 2025", desc: "Participate in our annual coding hackathon." },
  ];

  return (
    <main className="font-serif overflow-x-hidden bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight text-gray-900 mb-4 leading-tight">
                "Zero Experience to <span className="text-green-600">Hero Developer</span>"
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed mb-6 md:mb-8">
                Experience is the best teacher, there are no other ways of learning.
                It's a skill that can be learned through experience and practice.
              </p>
              <Link
                to="/about"
                className="bg-green-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold tracking-wide hover:bg-green-700 transition inline-block"
              >
                Read Now
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <img src={heroImg} alt="Developer illustration" className="rounded-lg shadow-xl max-w-full h-auto w-3/4 md:w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Video Section + Description - Full Width, Light Theme, No Background */}
      <section className="py-12 md:py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
            {/* Left side - Video */}
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-100">
                <div className="relative pb-[70.25%] h-0">
                  <video
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    controls
                    autoPlay
                    muted
                    loop
                  >
                    <source src="/videos/mueen-sir.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
            {/* Right side - Self-Paced Course Description */}
            <div className="w-full lg:w-1/2 space-y-4 text-center lg:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Full Stack Development Course
              </h3>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                Learn at your own pace with our comprehensive self-paced Full Stack program.
                Master frontend (React, Tailwind) and backend (Node.js, Express, MongoDB)
                through structured modules, real-world projects, and lifetime access to all materials.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-2 justify-center lg:justify-start">
                  <FaCheckCircle className="text-green-600" /> 100% self-paced learning – study anytime, anywhere
                </li>
                <li className="flex items-center gap-2 justify-center lg:justify-start">
                  <FaCheckCircle className="text-green-600" /> Build 5 portfolio-worthy projects (MERN stack)
                </li>
                <li className="flex items-center gap-2 justify-center lg:justify-start">
                  <FaCheckCircle className="text-green-600" /> Resume building, mock interviews & job referrals
                </li>
                <li className="flex items-center gap-2 justify-center lg:justify-start">
                  <FaCheckCircle className="text-green-600" /> Certificate upon completion & lifetime access
                </li>
              </ul>
              <div className="pt-4">
                <Link
                  to="/contact"
                  className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Enroll Now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-900">Why Choose ZIAS?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon={FaUserGraduate} title="Expert Mentors" description="Learn from industry professionals with years of experience." />
            <FeatureCard icon={FaProjectDiagram} title="Real Projects" description="Build portfolio-worthy projects that showcase your skills." />
            <FeatureCard icon={FaBriefcase} title="Placement Support" description="Get resume reviews, mock interviews, and job referrals." />
            <FeatureCard icon={FaChalkboardTeacher} title="Self-Paced Learning" description="Study at your own rhythm with lifetime access to materials." />
          </div>
        </div>
      </section>

      {/* Statistics Counter */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
              <FaUserGraduate className="text-green-600 text-4xl md:text-5xl mx-auto mb-3" />
              <div className="text-2xl md:text-4xl font-bold text-gray-900"><Counter target={1200} />+</div>
              <p className="text-gray-600 text-sm md:text-base mt-2">Students Trained</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
              <FaBriefcase className="text-green-600 text-4xl md:text-5xl mx-auto mb-3" />
              <div className="text-2xl md:text-4xl font-bold text-gray-900"><Counter target={85} />%</div>
              <p className="text-gray-600 text-sm md:text-base mt-2">Placement Rate</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
              <FaChalkboardTeacher className="text-green-600 text-4xl md:text-5xl mx-auto mb-3" />
              <div className="text-2xl md:text-4xl font-bold text-gray-900"><Counter target={25} />+</div>
              <p className="text-gray-600 text-sm md:text-base mt-2">Expert Mentors</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
              <FaProjectDiagram className="text-green-600 text-4xl md:text-5xl mx-auto mb-3" />
              <div className="text-2xl md:text-4xl font-bold text-gray-900"><Counter target={350} />+</div>
              <p className="text-gray-600 text-sm md:text-base mt-2">Projects Completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Areas of involvement */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-900">Areas of involvement</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { img: coursesImg, title: "Courses", desc: "Learn modern full stack technologies with structured lessons and expert guidance." },
              { img: certificationsImg, title: "Certifications", desc: "Earn an industry-recognized certificate after completing your training." },
              { img: projectsImg, title: "Projects", desc: "Build real-world projects and gain practical development experience." }
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl shadow-lg p-4 md:p-6 hover:shadow-xl transition text-center">
                <div className="flex justify-center mb-4">
                  <img src={item.img} alt={item.title} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-full" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-sm md:text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1">
              <img src={journeyImg} alt="Journey" className="rounded-lg shadow-xl w-full" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Start Your Developer Journey Today</h2>
              <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8">Take the first step toward becoming a professional developer. Learn modern technologies, build real-world projects, and gain the skills needed for a successful career.</p>
              <Link to="/contact" className="bg-green-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold hover:bg-green-700 transition inline-block">
                Start Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-900">What Our Students Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { name: "Udaifa K.K", role: "Full Stack Developer", text: "The hands-on projects and mentor support helped me land a job at a top tech company. Highly recommended!", initial: "U" },
              { name: "Hasna C.H", role: "Frontend Developer", text: "ZIAS transformed my career. The curriculum is industry-relevant and the community is very supportive.", initial: "H" },
              { name: "Wafa Fathima C.K", role: "Backend Developer", text: "Best decision ever! The real-world projects gave me the confidence to build complex applications.", initial: "W" }
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 p-4 md:p-5 rounded-xl shadow-md hover:shadow-lg transition flex flex-col sm:flex-row gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg md:text-xl font-bold">
                    {t.initial}
                  </div>
                </div>
                <div>
                  <FaQuoteLeft className="text-green-600 text-lg md:text-xl mb-2 opacity-50" />
                  <p className="text-gray-600 italic text-sm md:text-base mb-3">"{t.text}"</p>
                  <div className="font-semibold text-gray-800">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                  <div className="flex text-yellow-400 mt-2 text-sm">{[...Array(5)].map((_, i) => <FaStar key={i} />)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-900">Explore Our Programs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { Icon: FaCode, name: "Fullstack Development", desc: "Learn both frontend and backend technologies to become a complete developer." },
              { Icon: FaLaptopCode, name: "Frontend Development", desc: "Build responsive and interactive user interfaces using modern tools." },
              { Icon: FaServer, name: "Backend Development", desc: "Create powerful APIs and handle server-side logic efficiently." },
              { Icon: FaDatabase, name: "Database Management", desc: "Learn to design and manage databases like PostgreSQL and MySQL." },
              { Icon: FaProjectDiagram, name: "Project Development", desc: "Work on real-world projects to gain practical experience." },
              { Icon: FaChartLine, name: "Career Preparation", desc: "Get ready for jobs with interview prep, resume building, and guidance." }
            ].map((p, i) => (
              <div key={i} className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-xl transition text-center group">
                <p.Icon className="text-green-600 text-3xl md:text-4xl mx-auto mb-3 md:mb-4 group-hover:scale-110 transition" />
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">{p.name}</h3>
                <p className="text-gray-600 text-sm md:text-base">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose ZIAS */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Why Choose ZIAS</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3"><FaCheckCircle className="text-green-600 text-xl mt-1" /><span className="text-gray-700 text-sm md:text-base">Real-world project experience.</span></li>
                <li className="flex items-start gap-3"><FaUsers className="text-green-600 text-xl mt-1" /><span className="text-gray-700 text-sm md:text-base">Career-ready skill development.</span></li>
                <li className="flex items-start gap-3"><FaGlobe className="text-green-600 text-xl mt-1" /><span className="text-gray-700 text-sm md:text-base">Mentor guidance and feedback.</span></li>
                <li className="flex items-start gap-3"><FaLightbulb className="text-green-600 text-xl mt-1" /><span className="text-gray-700 text-sm md:text-base">Industry-focused curriculum.</span></li>
              </ul>
            </div>
            <div className="flex-1"><img src={zias} alt="ZIAS" className="rounded-lg shadow-xl w-full" /></div>
          </div>
        </div>
      </section>

      {/* Latest News & Updates */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 flex items-center justify-center gap-2 flex-wrap text-gray-900">
            <FaNewspaper className="text-green-600" /> Latest News & Updates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {updates.map((update, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-4 md:p-5 hover:shadow-lg transition">
                <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm mb-2">
                  <FaCalendarAlt /> {update.date}
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">{update.title}</h3>
                <p className="text-gray-600 text-sm md:text-base mb-3">{update.desc}</p>
                <Link to="/news" className="text-green-600 text-sm font-medium hover:underline">Read more →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-2 border rounded-xl p-4 md:p-6 bg-gray-50">
            {[
              { q: "What are the prerequisites for the Full Stack course?", a: "Basic knowledge of any programming language is helpful but not mandatory. We start from fundamentals." },
              { q: "Is the course online or offline?", a: "All courses are delivered online with self-paced learning materials available 24/7." },
              { q: "Do you provide placement assistance?", a: "Yes, we offer resume building, mock interviews, and job referrals to our students." },
              { q: "Can I pay in installments?", a: "Yes, we have flexible payment plans. Contact our support for details." },
              ...extraFaqs
            ].map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} isOpen={openFaq === i} onClick={() => toggleFaq(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-20 bg-green-700">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Become a Hero Developer?</h2>
          <p className="text-base md:text-lg text-green-100 mb-6 md:mb-8">Join thousands of students who have transformed their careers with ZIAS.</p>
          <Link to="/contact" className="inline-block bg-white text-green-700 px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Enroll Now
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Home;