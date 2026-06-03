import { useEffect, useState } from "react";
import API from "../api/api";
import toast from "react-hot-toast";

function AdminFeeStructure() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    total_amount: "",
    discount_percentage: 0,
    number_of_installments: 1,
    is_active: true,
  });

  // Fetch fee structures from API
  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      const response = await API.get("/fee-structures/");
      console.log("API Response:", response.data);
      
      // Handle both array and object responses
      const structures = Array.isArray(response.data) ? response.data : response.data.results || [];
      setFeeStructures(structures);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      toast.error("Failed to load fee structures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  // Handle form submit for create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Fee structure name is required");
      return;
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }
    
    try {
      const payload = {
        name: formData.name.trim(),
        total_amount: parseFloat(formData.total_amount),
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        number_of_installments: parseInt(formData.number_of_installments),
        is_active: formData.is_active,
      };
      
      if (editingId) {
        await API.patch(`/fee-structures/${editingId}/`, payload);
        toast.success("Fee structure updated successfully");
      } else {
        await API.post("/fee-structures/", payload);
        toast.success("Fee structure created successfully");
      }
      
      // Reset form and refresh data
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        total_amount: "",
        discount_percentage: 0,
        number_of_installments: 1,
        is_active: true,
      });
      fetchFeeStructures();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  // Handle delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      await API.delete(`/fee-structures/${id}/`);
      toast.success("Deleted successfully");
      fetchFeeStructures();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Delete failed");
    }
  };

  // Handle edit
  const handleEdit = (fs) => {
    setEditingId(fs.id);
    setFormData({
      name: fs.name,
      total_amount: fs.total_amount,
      discount_percentage: fs.discount_percentage || 0,
      number_of_installments: fs.number_of_installments || 1,
      is_active: fs.is_active,
    });
    setShowForm(true);
  };

  // Toggle active status
  const toggleStatus = async (fs) => {
    try {
      await API.patch(`/fee-structures/${fs.id}/`, { is_active: !fs.is_active });
      toast.success(`Fee structure ${!fs.is_active ? "activated" : "deactivated"}`);
      fetchFeeStructures();
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status");
    }
  };

  // Calculate per week amount
  const getPerWeekAmount = (fs) => {
    const discounted = fs.total_amount * (1 - (fs.discount_percentage || 0) / 100);
    return discounted / (fs.number_of_installments || 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading fee structures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fee Structure Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage course fees and installment plans</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: "",
                total_amount: "",
                discount_percentage: 0,
                number_of_installments: 1,
                is_active: true,
              });
              setShowForm(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <span>+</span> Add Fee Structure
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-gray-500 text-sm">Total Structures</p>
            <p className="text-2xl font-bold text-gray-800">{feeStructures.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-gray-500 text-sm">Active Structures</p>
            <p className="text-2xl font-bold text-green-600">
              {feeStructures.filter(fs => fs.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-600">
              ₹{feeStructures.reduce((sum, fs) => sum + parseFloat(fs.total_amount), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Fee Structures Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per Week</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {feeStructures.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No fee structures found. Click "Add Fee Structure" to create one.
                    </td>
                  </tr>
                ) : (
                  feeStructures.map((fs) => (
                    <tr key={fs.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{fs.name}</p>
                          <p className="text-xs text-gray-500">ID: {fs.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        ₹{parseFloat(fs.total_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {fs.discount_percentage > 0 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {fs.discount_percentage}% OFF
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-medium">{fs.number_of_installments} weeks</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          ₹{getPerWeekAmount(fs).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(fs)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            fs.is_active
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {fs.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(fs)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(fs.id, fs.name)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📚 How It Works</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Discount:</strong> Percentage discount applied before calculating installment amounts</p>
            <p>• <strong>Installments:</strong> Total fee divided into weekly payments</p>
            <p>• <strong>Per Week:</strong> Amount students need to pay each week (after discount)</p>
            <p>• <strong>Status:</strong> Active structures are visible to students</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{editingId ? "Edit" : "Create"} Fee Structure</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., B.Tech CS - Semester 1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 50000"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={e => setFormData({ ...formData, discount_percentage: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 10"
                  min="0"
                  max="100"
                />
                {formData.total_amount && formData.discount_percentage > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    After discount: ₹{(parseFloat(formData.total_amount) * (1 - formData.discount_percentage / 100)).toFixed(2)}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Installments (Weeks)</label>
                <input
                  type="number"
                  value={formData.number_of_installments}
                  onChange={e => setFormData({ ...formData, number_of_installments: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="1"
                  max="52"
                />
                {formData.total_amount && formData.number_of_installments > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Per week: ₹{(
                      (parseFloat(formData.total_amount) * (1 - formData.discount_percentage / 100)) / 
                      parseInt(formData.number_of_installments)
                    ).toFixed(2)}
                  </p>
                )}
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-700">Active (visible to students)</span>
              </label>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                  {editingId ? "Update" : "Create"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFeeStructure;