import React from "react";
import about from "../assets/images/about.jpg"
import Footer from "../components/Footer";
import { Link } from "react-router-dom"; // if you want a button linking elsewhere

const About = () => {
  return (
    <main className="font-sans">
      {/* Hero Section (same gradient as Home) */}
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight text-gray-900 mb-4">
                About <span className="text-green-600">ZIAS</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto md:mx-0">
               ZIAS is a developer training platform that helps students learn modern software development through practical learning and real-world projects. The platform provides structured training programs designed to build strong coding skills and prepare learners for careers in the technology industry.


              </p>
              <Link
                to="/contact"
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold tracking-wide hover:bg-green-700 transition inline-block"
              >
                Join Us Today
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <img
                src={about}
                alt="About ZIAS"
                className="rounded-lg shadow-xl max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Learning Process (alternating bg-gray-50) */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-display tracking-tight text-center text-gray-900 mb-12">
            Our Learning Process
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 grid grid-cols-2 gap-4 place-items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-3xl">💡</div>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-3xl">🎓</div>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-3xl">💻</div>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-3xl">📈</div>
            </div>
            <div className="flex-1 text-center md:text-left text-gray-700 text-lg leading-relaxed">
              <p>
                At <span className="font-semibold text-gray-900">ZIAS</span>, learning is focused on practice 
                and real-world development experience. Students follow a structured training 
                path that includes weekly modules, project development, mentor reviews, 
                and progress tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Options (white background) */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-display tracking-tight text-center text-gray-900 mb-12">
            Payment Options
          </h2>
          <div className="space-y-8">
            {[
              { id: "1", title: "Pay After Placement", desc: "Students can join training and pay the fee after getting placed in a company." },
              { id: "2", title: "Full Payment", desc: "Students can pay the entire training fee at the beginning of the program." },
              { id: "3", title: "Monthly Installments", desc: "Students can split the training fee into monthly payments for easier access." }
            ].map((item) => (
              <div key={item.id} className="border-l-4 border-green-500 pl-6 py-2">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{item.id} - {item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Goal (alternating bg-gray-50) */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-display tracking-tight text-center text-gray-900 mb-12">
            Our Goal
          </h2>
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="flex-1 text-center md:text-right text-lg text-gray-700 leading-relaxed">
              <p>
                <span className="font-semibold text-gray-900">ZIAS</span> aims to create a strong 
                community of developers who can build modern applications, solve 
                real-world problems, and grow in the software industry.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-6 place-items-center">
              <div className="w-16 h-16 bg-green-50 p-4 rounded-xl flex items-center justify-center text-2xl shadow-sm">🤝</div>
              <div className="w-16 h-16 bg-green-50 p-4 rounded-xl flex items-center justify-center text-2xl shadow-sm">⚡</div>
              <div className="w-16 h-16 bg-green-50 p-4 rounded-xl flex items-center justify-center text-2xl shadow-sm">📊</div>
              <div className="w-16 h-16 bg-green-50 p-4 rounded-xl flex items-center justify-center text-2xl shadow-sm">🚀</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default About;