// src/pages/Home.jsx
import heroImg from '../assets/images/heroImg.png';
import coursesImg from '../assets/images/coursesImg.png';
import certificationsImg from '../assets/images/certification.jpg';   // adjust filename if needed
import projectsImg from '../assets/images/projects.jpg';
import journeyImg from '../assets/images/journeyImg.jpg'; 
import zias from '../assets/images/zias.png';

import {
  FaCheckCircle, FaUsers, FaGlobe, FaLightbulb,
  FaCode, FaLaptopCode, FaServer, FaDatabase,
  FaProjectDiagram, FaChartLine,
} from 'react-icons/fa';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom'; 

const Home = () => {
  return (
    <main className="font-serif">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight text-gray-900 mb-4 leading-tight">
                "Zero Experience to <span className="text-green-600">Hero Developer</span>"
              </h1>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto md:mx-0">
                Experience is the best teacher, there are no other ways of learning. 
                It's a skill that can be learned through experience and practice.
              </p>

              <Link
                to="/about"
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold tracking-wide hover:bg-green-700 transition"
              >
                Read Now
              </Link>
            </div>

            <div className="flex-1 flex justify-center">
              <img src={heroImg} alt="Developer illustration" className="rounded-lg shadow-xl max-w-full h-auto" />
            </div>

          </div>
        </div>
      </section>

      {/* Areas */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <h2 className="text-3xl font-bold font-display tracking-tight text-center text-gray-900 mb-12">
            Areas of involvement section
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            {[{img:coursesImg, title:"Courses", desc:"Learn modern full stack technologies with structured lessons and expert guidance."},
              {img:certificationsImg, title:"Certifications", desc:"Earn an industry-recognized certificate after completing your training."},
              {img:projectsImg, title:"Projects", desc:"Build real-world projects and gain practical development experience."}
            ].map((item,i)=>(
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition text-center">
                <div className="flex justify-center mb-4">
                  <img src={item.img} alt={item.title} className="w-24 h-24 object-cover rounded-full" />
                </div>
                <h3 className="text-xl font-semibold font-display tracking-tight text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row items-center justify-between gap-12">

            <div className="flex-1 flex justify-center">
              <img src={journeyImg} alt="Developer journey" className="rounded-lg shadow-xl max-w-full h-auto" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold font-display tracking-tight text-gray-900 mb-4">
                Start Your Developer Journey Today
              </h2>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto md:mx-0">
                Take the first step toward becoming a professional developer.
                Learn modern technologies, build real-world projects, and gain the skills needed for a successful career.
              </p>

              <Link
                to="/contact"
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold tracking-wide hover:bg-green-700 transition"
              >
                Start Now
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-display tracking-tight text-center text-gray-900 mb-12">
            Explore Our Programs
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[ 
              { Icon: FaCode, name: "Fullstack Development", desc: "Learn both frontend and backend technologies to become a complete developer." },
              { Icon: FaLaptopCode, name: "Frontend Development", desc: "Build responsive and interactive user interfaces using modern tools." },
              { Icon: FaServer, name: "Backend Development", desc: "Create powerful APIs and handle server-side logic efficiently." },
              { Icon: FaDatabase, name: "Database Management", desc: "Learn to design and manage databases like PostgreSQL and MySQL." },
              { Icon: FaProjectDiagram, name: "Project Development", desc: "Work on real-world projects to gain practical experience." },
              { Icon: FaChartLine, name: "Career Preparation", desc: "Get ready for jobs with interview prep, resume building, and guidance." }
            ].map((program, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-xl transition">
                <program.Icon className="text-green-600 text-4xl mx-auto mb-4" />
                <h3 className="text-lg font-semibold font-display tracking-tight text-gray-800 mb-2">
                  {program.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {program.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold font-display tracking-tight text-gray-900 mb-8 text-center md:text-left">
                Why Choose ZIAS
              </h2>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-600 text-xl mt-1" />
                  <span className="text-lg text-gray-700 leading-relaxed">
                    Real-world project experience.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FaUsers className="text-green-600 text-xl mt-1" />
                  <span className="text-lg text-gray-700 leading-relaxed">
                    Career-ready skill development.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FaGlobe className="text-green-600 text-xl mt-1" />
                  <span className="text-lg text-gray-700 leading-relaxed">
                    Mentor guidance and feedback.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FaLightbulb className="text-green-600 text-xl mt-1" />
                  <span className="text-lg text-gray-700 leading-relaxed">
                    Industry-focused curriculum.
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex-1 flex justify-center">
              <img src={zias} alt="ZIAS" className="rounded-lg shadow-xl max-w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Home;