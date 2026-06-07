import about from "../assets/images/about.jpg";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <main className="font-sans overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-emerald-700 text-white py-20 md:py-28">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                About <span className="text-yellow-300">ZIAS</span>
              </h1>
              <p className="text-lg md:text-xl text-green-50 leading-relaxed mb-8">
                ZIAS is a premier developer training platform that helps students master modern software development through hands-on learning and real-world projects. Our structured programs build strong coding skills and prepare learners for successful careers in technology.
              </p>
              <Link
                to="/contact"
                className="inline-block bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-semibold tracking-wide hover:bg-yellow-300 transition transform hover:scale-105 shadow-lg"
              >
                Join Us Today
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <img 
                src={about} 
                alt="About ZIAS" 
                className="rounded-2xl shadow-2xl max-w-full h-auto w-4/5 md:w-full border-4 border-white" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Campus Showcase Video Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Campus
            </h2>
            <div className="w-24 h-1 bg-green-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A world-class learning environment designed for innovation and collaboration
            </p>
          </div>
          
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
            <video 
              controls 
              autoPlay 
              muted 
              loop
              className="w-full h-auto"
              poster="/campus-poster.jpg"
            >
              <source src="/videos/cmps short.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-600">Modern Labs</div>
              <div className="text-gray-600">State-of-the-art equipment</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-600">Smart Classrooms</div>
              <div className="text-gray-600">Interactive learning spaces</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-600">Collaborative Zones</div>
              <div className="text-gray-600">Team work areas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Testimonial Video Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Student Success Stories
            </h2>
            <div className="w-24 h-1 bg-green-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real experiences from our successful graduates
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <video 
              controls 
              className="w-full h-auto"
              poster="/student-poster.jpg"
            >
              <source src="/videos/wafa's.MP4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div className="flex justify-center gap-8 mt-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-gray-600">100+ Success Stories</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-gray-600">Top Companies</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-gray-600">Career Growth</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose ZIAS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose ZIAS?
            </h2>
            <div className="w-24 h-1 bg-green-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              What makes our training program stand out
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Practical Learning</h3>
              <p className="text-gray-600 text-center">Hands-on projects and real-world applications</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Expert Mentors</h3>
              <p className="text-gray-600 text-center">Guidance from industry professionals</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Placement Support</h3>
              <p className="text-gray-600 text-center">100% job assistance guaranteed</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Certification</h3>
              <p className="text-gray-600 text-center">Industry-recognized certificates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Plans */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Flexible Payment Options
            </h2>
            <div className="w-24 h-1 bg-green-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Pay After Placement</h3>
              <p className="text-gray-600 leading-relaxed">
                Start learning today with zero upfront cost. Pay only after you secure a job with minimum salary guarantee.
              </p>
              <div className="mt-6 pt-6 border-t border-green-200">
                <div className="text-sm text-green-600 font-semibold">✓ No upfront payment</div>
                <div className="text-sm text-green-600 font-semibold">✓ Income-based repayment</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform md:scale-105">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Full Payment</h3>
              <p className="text-gray-600 leading-relaxed">
                Pay the complete fee upfront and get exclusive benefits including additional resources and priority support.
              </p>
              <div className="mt-6 pt-6 border-t border-blue-200">
                <div className="text-sm text-blue-600 font-semibold">✓ 15% discount</div>
                <div className="text-sm text-blue-600 font-semibold">✓ Bonus materials</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Monthly Installments</h3>
              <p className="text-gray-600 leading-relaxed">
                Split your fee into easy monthly payments. Flexible terms available for 3, 6, or 12 months.
              </p>
              <div className="mt-6 pt-6 border-t border-purple-200">
                <div className="text-sm text-purple-600 font-semibold">✓ Zero interest</div>
                <div className="text-sm text-purple-600 font-semibold">✓ Flexible tenure</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="text-green-600 mb-6">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                To empower aspiring developers with practical skills, real-world experience, and career guidance needed to succeed in the technology industry.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="text-green-600 mb-6">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Create a strong community of developers who can build modern applications, solve real-world problems, and grow in the software industry.
              </p>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t border-gray-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">500+</div>
              <div className="text-gray-600 mt-2">Students Trained</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">95%</div>
              <div className="text-gray-600 mt-2">Placement Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">50+</div>
              <div className="text-gray-600 mt-2">Expert Mentors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">1000+</div>
              <div className="text-gray-600 mt-2">Projects Built</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-700 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join ZIAS today and transform your career in tech
          </p>
          <Link
            to="/contact"
            className="inline-block bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition transform hover:scale-105 shadow-lg"
          >
            Enroll Now
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default About;