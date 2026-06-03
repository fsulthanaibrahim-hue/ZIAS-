import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { toast } from 'react-hot-toast';

function FeeOverview() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const response = await API.get('/fee-structures/');
      const structures = response.data.results || response.data || [];
      setFeeStructures(structures);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load fee structures');
      setFeeStructures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
    
    // Listen for updates from AdminFeeStructure
    const handleUpdate = () => {
      fetchFeeStructures();
    };
    window.addEventListener('feeStructureChanged', handleUpdate);
    window.addEventListener('storage', function(e) {
      if (e.key === 'fee_structure_updated') {
        fetchFeeStructures();
      }
    });
    
    return () => {
      window.removeEventListener('feeStructureChanged', handleUpdate);
    };
  }, []);

  const calculateDiscountedAmount = (total, discount) => {
    return total * (1 - discount / 100);
  };

  const calculateTotalDiscountedRevenue = () => {
    return feeStructures.reduce(function(sum, s) {
      const total = parseFloat(s.total_amount) || 0;
      const discount = parseFloat(s.discount_percentage) || 0;
      const discounted = calculateDiscountedAmount(total, discount);
      return sum + discounted;
    }, 0);
  };

  const calculatePerWeek = (fs) => {
    const total = parseFloat(fs.total_amount) || 0;
    const discount = parseFloat(fs.discount_percentage) || 0;
    const installments = parseInt(fs.number_of_installments) || 1;
    const discounted = total * (1 - discount / 100);
    return discounted / installments;
  };

  const filteredStructures = feeStructures.filter(function(s) {
    const searchLower = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(searchLower);
  });

  const formatCurrency = function(amount) {
    return '₹' + (amount || 0).toLocaleString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading fee structures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Fee Structures Overview</h1>
          <button
            onClick={fetchFeeStructures}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <p className="text-gray-500 text-sm">Total Structures</p>
            <p className="text-2xl font-bold text-blue-700">{feeStructures.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-5 border border-green-200">
            <p className="text-gray-500 text-sm">Active Structures</p>
            <p className="text-2xl font-bold text-green-700">
              {feeStructures.filter(function(f) { return f.is_active; }).length}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(calculateTotalDiscountedRevenue())}</p>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by fee structure name..."
            value={search}
            onChange={function(e) { setSearch(e.target.value); }}
            className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installments</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per Week</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStructures.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">No fee structures found. Create one in Fee Structure Management page.</td>
                </tr>
              ) : (
                filteredStructures.map(function(fs) {
                  const total = parseFloat(fs.total_amount) || 0;
                  const discount = parseFloat(fs.discount_percentage) || 0;
                  const discountedAmount = total * (1 - discount / 100);
                  
                  return (
                    <tr key={fs.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{fs.name || '—'}</p>
                        <p className="text-xs text-gray-500">ID: {fs.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="line-through text-gray-400">{formatCurrency(total)}</span>
                        <span className="ml-2 font-medium text-green-600">{formatCurrency(discountedAmount)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {discount > 0 ? (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            {discount}% OFF
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{fs.number_of_installments} weeks</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 font-medium">₹{calculatePerWeek(fs).toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={"px-2 py-0.5 text-xs rounded-full " + (fs.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                          {fs.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2">📌 Note</h3>
          <p className="text-sm text-yellow-800">
            This page shows all fee structure templates. Total Revenue shows the discounted amount after applying all discounts.
            Changes made in Fee Structure Management will appear here immediately after refresh.
          </p>
        </div>
      </div>
    </div>
  );
}

export default FeeOverview;