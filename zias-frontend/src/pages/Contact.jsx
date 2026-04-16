import React, { useState } from "react";
import axios from "axios";
import { 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaEnvelope,
  FaInstagram,
  FaLinkedin,
  FaWhatsapp,
  FaYoutube,
  FaGithub
} from "react-icons/fa";
import Footer from "../components/Footer";

// Toast Component
function Toast({ message, type, onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" 
    ? "bg-emerald-500/90" 
    : type === "error" 
    ? "bg-red-500/90" 
    : "bg-blue-500/90";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">×</button>
    </div>
  );
}

const Contact = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone: only digits, max 10
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, [name]: numericValue });
      
      // Clear phone error if valid
      if (numericValue.length === 10 || numericValue.length === 0) {
        setErrors({ ...errors, phone: "" });
      } else {
        setErrors({ ...errors, phone: "Phone number must be exactly 10 digits" });
      }
    } else {
      setFormData({ ...formData, [name]: value });
      // Clear error for this field if present
      if (errors[name]) {
        setErrors({ ...errors, [name]: "" });
      }
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (formData.phone.length !== 10) newErrors.phone = "Phone number must be exactly 10 digits";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Send to backend API
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/contact/", formData);
      showToast(res.data.detail, "success");
      // Reset form on success
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
      setErrors({});
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to send message. Please try again.";
      showToast(errorMsg, "error");
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <style>{`
        @keyframes slide-in-from-top-2 {
          from { opacity:0; transform:translateY(-1rem); }
          to { opacity:1; transform:translateY(0); }
        }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
      `}</style>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Have questions about our courses or training programs? <br />
            Get in touch with us and our team will assist you.
          </p>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gray-50 rounded-3xl shadow-lg p-10 space-y-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Contact Information
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Address Card */}
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 text-center">
              <FaMapMarkerAlt className="text-green-600 text-4xl mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Address</h3>
              <p className="text-gray-600 leading-relaxed">
                Zaitoon Institute of Applied Skills<br />
                Kannur, Payyanur, Aravanchal
              </p>
            </div>

            {/* Phone Card */}
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 text-center">
              <FaPhoneAlt className="text-green-600 text-4xl mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600 leading-relaxed">
                +91 98765 43210<br />
                +91 98764 54410
              </p>
            </div>

            {/* Email Card */}
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 text-center">
              <FaEnvelope className="text-green-600 text-4xl mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 leading-relaxed">
                zias@gmail.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gray-50 rounded-3xl shadow-lg p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Send Us a Message
          </h2>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-green-500 outline-none`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-green-500 outline-none`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
                className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-green-500 outline-none`}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Enter subject"
                className={`w-full px-4 py-3 rounded-lg border ${errors.subject ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-green-500 outline-none`}
              />
              {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
            </div>

            {/* Message (Full Width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                rows="5"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message..."
                className={`w-full px-4 py-3 rounded-lg border ${errors.message ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-green-500 outline-none`}
              ></textarea>
              {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
            </div>

            {/* Button */}
            <div className="md:col-span-2 text-center">
              <button
                type="submit"
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Connect With Us
          </h2>
          <p className="text-gray-600 mb-8">
            Follow us on social media and stay updated with our latest courses and programs.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/zaitoon"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-100 hover:bg-green-600 text-gray-600 hover:text-white transition shadow-md"
            >
              <FaInstagram size={22} />
            </a>
            {/* Whatsapp */}  
            <a
              href="https://wa.me/919876543210?text=Hi%20ZIAS,%20I%20want%20to%20know%20more%20about%20your%20courses"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-100 hover:bg-green-600 text-gray-600 hover:text-white transition shadow-md"
            >
              <FaWhatsapp size={22} />
            </a>
            {/* Youtube */}
            <a
              href="https://www.youtube.com/results?search_query=zaitoon"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-100 hover:bg-green-600 text-gray-600 hover:text-white transition shadow-md"
            >
              <FaYoutube size={22} />
            </a>
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/zaitooncampus/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-100 hover:bg-green-600 text-gray-600 hover:text-white transition shadow-md"
            >
              <FaLinkedin size={22} />
            </a>
          </div>
        </div>
      </section>

      {/* Google Map Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Our Location
        </h2>
        <div className="w-full h-96 rounded-3xl overflow-hidden shadow-lg">
          <iframe
            src="https://www.google.com/maps?q=Zaitoon+Institute+of+Applied+Skills+Aravanchal+Kannur&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Zaitoon Aravanchal Location"
          ></iframe>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;