import {
  FaCode, FaCloud, FaMobileAlt, FaRobot,
  FaComments, FaProjectDiagram, FaUserTie,
  FaBook, FaBriefcase
} from "react-icons/fa";
import Footer from "../components/Footer";

const Courses = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-gray-900 mb-4">
            Our <span className="text-green-600">Professional Courses</span>
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Industry-focused programs designed to make you a skilled, job-ready developer.
          </p>
        </div>
      </section>

      {/* Courses Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold font-display text-gray-900 mb-6 text-center">
          Explore Our Courses
        </h2>
        <p className="text-gray-600 text-base md:text-lg mb-8 md:mb-12 max-w-3xl mx-auto text-center leading-relaxed">
          From beginner to advanced levels, learn modern technologies with hands-on projects and expert guidance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {[
            { Icon: FaCode, title: "Full Stack Development", desc: "Master frontend and backend technologies with modern frameworks." },
            { Icon: FaRobot, title: "Data Science & AI", desc: "Analyze data, build ML models, and implement AI solutions." },
            { Icon: FaMobileAlt, title: "Mobile App Development", desc: "Create beautiful mobile apps with Flutter and React Native." },
            { Icon: FaCloud, title: "DevOps & Cloud", desc: "Learn cloud deployment, CI/CD pipelines, and automation skills." },
          ].map((course, i) => (
            <div key={i} className="bg-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 text-center">
              <course.Icon className="text-green-600 text-3xl md:text-4xl mb-4 mx-auto" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">{course.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold font-display text-gray-900 mb-6 text-center">
          Course Highlights
        </h2>
        <p className="text-gray-600 text-base md:text-lg mb-8 md:mb-12 max-w-3xl mx-auto text-center leading-relaxed">
          Key benefits you get from our programs to excel in your career.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {[
            { Icon: FaComments, title: "Communication Skills", desc: "Enhance your teamwork and presentation skills." },
            { Icon: FaProjectDiagram, title: "Live Projects", desc: "Work on real-world projects for practical experience." },
            { Icon: FaUserTie, title: "Mentor Guidance", desc: "Get feedback and mentoring from industry experts." },
          ].map((highlight, i) => (
            <div key={i} className="bg-white p-4 md:p-5 rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 text-center">
              <highlight.Icon className="text-green-600 text-2xl md:text-3xl mb-3 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">{highlight.title}</h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{highlight.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { Icon: FaBook, title: "Structured Curriculum", desc: "Step-by-step learning path from beginner to advanced." },
            { Icon: FaBriefcase, title: "Placement Support", desc: "Resume building, mock interviews, and career guidance." },
          ].map((highlight, i) => (
            <div key={i} className="bg-white p-4 md:p-5 rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 text-center">
              <highlight.Icon className="text-green-600 text-2xl md:text-3xl mb-3 mx-auto" />
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">{highlight.title}</h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{highlight.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Courses;