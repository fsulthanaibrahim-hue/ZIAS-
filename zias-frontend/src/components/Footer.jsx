import { 
  FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaFacebook, FaTwitter, FaLinkedin 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-green-500 mb-4">ZIAS</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Platform designed to help students build real-world development skills through structured programs, projects, and mentorship.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-green-500">Home</Link></li>
              <li><Link to="/courses" className="hover:text-green-500">Courses</Link></li>
              <li><Link to="/about" className="hover:text-green-500">About</Link></li>
              <li><Link to="/contact" className="hover:text-green-500">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-center gap-2">
                <FaEnvelope className="text-green-500" />
                <a href="mailto:zias@gmail.com" className="hover:text-green-500">zias@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <FaPhone className="text-green-500 rotate-90" />
                <a href="tel:+919876543210" className="hover:text-green-500">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-green-500" />
                Kannur, Kerala
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/yourpage" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-green-500">
                <FaFacebook />
              </a>
              <a href="https://twitter.com/yourhandle" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-green-500">
                <FaTwitter />
              </a>
              <a href="https://www.linkedin.com/company/zaitooncampus/" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-green-500">
                <FaLinkedin />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-6 text-center text-gray-500 text-sm">
          © 2026 ZIAS. All Rights Reserved
        </div>

      </div>
    </footer>
  );
};

export default Footer;