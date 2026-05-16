// src/components/AccountsSidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaMoneyBillWave, FaFileInvoice, FaUsers, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

function AccountsSidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="w-64 bg-white border-r h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-green-600">Accounts</h2>
      </div>
      <nav className="space-y-2">
        <Link
          to="/accounts/dashboard"
          className={`flex items-center gap-3 p-2 rounded transition ${
            isActive('/accounts/dashboard') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
          }`}
        >
          <FaTachometerAlt /> Dashboard
        </Link>
        <Link
          to="/accounts/payments"
          className={`flex items-center gap-3 p-2 rounded transition ${
            isActive('/accounts/payments') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
          }`}
        >
          <FaMoneyBillWave /> Payments
        </Link>
        <Link
          to="/accounts/invoices"
          className={`flex items-center gap-3 p-2 rounded transition ${
            isActive('/accounts/invoices') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
          }`}
        >
          <FaFileInvoice /> Invoices
        </Link>
        <Link
          to="/accounts/students"
          className={`flex items-center gap-3 p-2 rounded transition ${
            isActive('/accounts/students') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
          }`}
        >
          <FaUsers /> Students
        </Link>
        <Link
          to="/accounts/profile"
          className={`flex items-center gap-3 p-2 rounded transition ${
            isActive('/accounts/profile') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
          }`}
        >
          <FaUserCircle /> Profile
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-100 text-red-600 transition"
        >
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </div>
  );
}

export default AccountsSidebar;