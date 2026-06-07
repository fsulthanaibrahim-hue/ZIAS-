import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: { "Content-Type": "application/json" }
});

function AdminFeeStructure() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    total_amount: "",
    discount_percentage: 0,
    number_of_months: 1,
    is_active: true,
  });

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      const response = await API.get("/fee-structures/");
      const structures = response.data.results || response.data || [];
      setFeeStructures(structures);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load fee structures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    try {
      const payload = {
        name: formData.name,
        total_amount: parseFloat(formData.total_amount),
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        number_of_months: parseInt(formData.number_of_months),
        is_active: formData.is_active,
      };
      
      if (editingId) {
        await API.patch(`/fee-structures/${editingId}/`, payload);
        toast.success("Updated successfully");
      } else {
        await API.post("/fee-structures/", payload);
        toast.success("Created successfully");
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ 
        name: "", 
        total_amount: "", 
        discount_percentage: 0, 
        number_of_months: 1, 
        is_active: true 
      });
      fetchFeeStructures();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await API.delete(`/fee-structures/${id}/`);
      toast.success("Deleted successfully");
      fetchFeeStructures();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleEdit = (fs) => {
    setEditingId(fs.id);
    setFormData({
      name: fs.name,
      total_amount: fs.total_amount,
      discount_percentage: fs.discount_percentage || 0,
      number_of_months: fs.number_of_months || 1,
      is_active: fs.is_active,
    });
    setShowForm(true);
  };

  const toggleStatus = async (fs) => {
    try {
      await API.patch(`/fee-structures/${fs.id}/`, { is_active: !fs.is_active });
      toast.success(`Fee structure ${!fs.is_active ? "activated" : "deactivated"}`);
      fetchFeeStructures();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const calculatePerMonth = (fs) => {
    const total = parseFloat(fs.total_amount) || 0;
    const discount = parseFloat(fs.discount_percentage) || 0;
    const months = parseInt(fs.number_of_months) || 1;
    const discounted = total * (1 - discount / 100);
    return discounted / months;
  };

  const calculateTotalRevenue = () => {
    return feeStructures.reduce((sum, f) => {
      const total = parseFloat(f.total_amount) || 0;
      const discount = parseFloat(f.discount_percentage) || 0;
      const discounted = total * (1 - discount / 100);
      return sum + discounted;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Fee Structure Management</h1>
              <p className="text-gray-500 text-sm mt-1">Manage course fees and monthly installment plans</p>
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ 
                  name: "", 
                  total_amount: "", 
                  discount_percentage: 0, 
                  number_of_months: 1, 
                  is_active: true 
                });
                setShowForm(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Fee Structure
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Total Structures</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{feeStructures.length}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Active Structures</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{feeStructures.filter(f => f.is_active).length}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">₹{calculateTotalRevenue().toLocaleString()}</p>
            </div>
          </div>

          {/* Fee Structures - Mobile Card View + Desktop Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per Month</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feeStructures.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No fee structures found. Click "Add Fee Structure" to create one.
                      </td>
                    </tr>
                  ) : (
                    feeStructures.map((fs) => {
                      const total = parseFloat(fs.total_amount) || 0;
                      const discount = parseFloat(fs.discount_percentage) || 0;
                      const afterDiscount = total * (1 - discount / 100);
                      const perMonth = calculatePerMonth(fs);
                      
                      return (
                        <tr key={fs.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{fs.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            {discount > 0 ? (
                              <>
                                <span className="line-through text-gray-400 mr-2">₹{total.toLocaleString()}</span>
                                <span className="font-medium text-emerald-600">₹{afterDiscount.toLocaleString()}</span>
                              </>
                            ) : (
                              <span className="font-medium text-gray-900">₹{total.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {discount > 0 ? (
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">{discount}% OFF</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {fs.number_of_months} Month{fs.number_of_months !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 font-medium text-emerald-600">
                            ₹{perMonth.toFixed(2)} / month
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleStatus(fs)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                fs.is_active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {fs.is_active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(fs)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(fs.id, fs.name)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {feeStructures.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-500">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No fee structures found.</p>
                  <p className="text-sm mt-1">Click "Add Fee Structure" to create one.</p>
                </div>
              ) : (
                feeStructures.map((fs) => {
                  const total = parseFloat(fs.total_amount) || 0;
                  const discount = parseFloat(fs.discount_percentage) || 0;
                  const afterDiscount = total * (1 - discount / 100);
                  const perMonth = calculatePerMonth(fs);
                  
                  return (
                    <div key={fs.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                      {/* Header with Name and Status */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900 text-base flex-1">{fs.name}</h3>
                        <button
                          onClick={() => toggleStatus(fs)}
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                            fs.is_active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {fs.is_active ? "Active" : "Inactive"}
                        </button>
                      </div>
                      
                      {/* Amount Section */}
                      <div className="mb-3 pb-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        {discount > 0 ? (
                          <div>
                            <span className="line-through text-gray-400 text-sm">₹{total.toLocaleString()}</span>
                            <span className="font-bold text-emerald-600 text-lg ml-2">₹{afterDiscount.toLocaleString()}</span>
                            <span className="inline-flex ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {discount}% OFF
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900 text-lg">₹{total.toLocaleString()}</span>
                        )}
                      </div>
                      
                      {/* Duration and Per Month */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Duration</p>
                          <p className="text-sm text-gray-700">{fs.number_of_months} Month{fs.number_of_months !== 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Per Month</p>
                          <p className="text-sm font-semibold text-emerald-600">₹{perMonth.toFixed(2)} / month</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(fs)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 rounded-lg transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(fs.id, fs.name)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-lg transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? "Edit" : "Create"} Fee Structure</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Hostel Fee, Course Fee, Mess Fee"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="Enter total amount"
                  value={formData.total_amount}
                  onChange={e => setFormData({...formData, total_amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                <input
                  type="number"
                  placeholder="Discount percentage"
                  value={formData.discount_percentage}
                  onChange={e => setFormData({...formData, discount_percentage: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-400 mt-1">Optional discount percentage (0-100%)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                <select
                  value={formData.number_of_months}
                  onChange={e => setFormData({...formData, number_of_months: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} Month{i + 1 !== 1 ? 's' : ''}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Select the number of months for payment duration</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Active (visible to students)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium transition">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFeeStructure;