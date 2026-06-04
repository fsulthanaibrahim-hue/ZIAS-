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
  const [applyingId, setApplyingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    total_amount: "",
    discount_percentage: 0,
    number_of_installments: 1,
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

  // APPLY FUNCTION - This creates the link between fee structure and students
  const handleApply = async (feeStructure) => {
    if (!window.confirm(`Apply "${feeStructure.name}" to ALL students? This will create fee records for every student.`)) {
      return;
    }
    
    setApplyingId(feeStructure.id);
    try {
      const response = await API.post(`/fee-structures/${feeStructure.id}/apply_to_students/`);
      toast.success(response.data.message || `Applied to ${response.data.new_assignments} students successfully!`);
      
      // Refresh the list
      await fetchFeeStructures();
    } catch (error) {
      console.error("Apply error:", error);
      toast.error(error.response?.data?.error || "Failed to apply fee structure");
    } finally {
      setApplyingId(null);
    }
  };

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
        number_of_installments: parseInt(formData.number_of_installments),
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
      setFormData({ name: "", total_amount: "", discount_percentage: 0, number_of_installments: 1, is_active: true });
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
      number_of_installments: fs.number_of_installments || 1,
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

  const calculatePerWeek = (fs) => {
    const total = parseFloat(fs.total_amount) || 0;
    const discount = parseFloat(fs.discount_percentage) || 0;
    const installments = parseInt(fs.number_of_installments) || 1;
    const discounted = total * (1 - discount / 100);
    return discounted / installments;
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
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fee Structure Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage course fees and installment plans</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: "", total_amount: "", discount_percentage: 0, number_of_installments: 1, is_active: true });
              setShowForm(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            + Add Fee Structure
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow border">
            <p className="text-gray-500 text-sm">Total Structures</p>
            <p className="text-2xl font-bold text-gray-800">{feeStructures.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow border">
            <p className="text-gray-500 text-sm">Active Structures</p>
            <p className="text-2xl font-bold text-green-600">{feeStructures.filter(f => f.is_active).length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow border">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-600">₹{calculateTotalRevenue().toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installments</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per Week</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {feeStructures.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No fee structures found. Click "Add Fee Structure" to create one.
                    </td>
                  </tr>
                ) : (
                  feeStructures.map((fs) => {
                    const total = parseFloat(fs.total_amount) || 0;
                    const discount = parseFloat(fs.discount_percentage) || 0;
                    const afterDiscount = total * (1 - discount / 100);
                    
                    return (
                      <tr key={fs.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{fs.name}</p>
                          <p className="text-xs text-gray-400">ID: {fs.id}</p>
                        </td>
                        <td className="px-4 py-3">
                          {discount > 0 ? (
                            <>
                              <span className="line-through text-gray-400 mr-2">₹{total.toLocaleString()}</span>
                              <span className="font-medium text-green-600">₹{afterDiscount.toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="font-medium">₹{total.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {discount > 0 ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">{discount}% OFF</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{fs.number_of_installments} weeks</td>
                        <td className="px-4 py-3">₹{calculatePerWeek(fs).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleStatus(fs)}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              fs.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {fs.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center flex-wrap">
                            <button
                              onClick={() => handleApply(fs)}
                              disabled={applyingId === fs.id}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                            >
                              {applyingId === fs.id ? "Applying..." : "APPLY"}
                            </button>
                            <button
                              onClick={() => handleEdit(fs)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(fs.id, fs.name)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
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
        </div>

        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">⚠️ CRITICAL STEP</h3>
          <p className="text-sm text-red-700">
            After creating a fee structure, you <strong className="text-red-800">MUST click the GREEN "APPLY" button</strong> to assign it to students!
            Without applying, students will show "No fee structure applied" and all amounts will be ₹0.
          </p>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{editingId ? "Edit" : "Create"} Fee Structure</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Total Amount"
                value={formData.total_amount}
                onChange={e => setFormData({...formData, total_amount: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Discount %"
                value={formData.discount_percentage}
                onChange={e => setFormData({...formData, discount_percentage: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="number"
                placeholder="Installments"
                value={formData.number_of_installments}
                onChange={e => setFormData({...formData, number_of_installments: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                />
                Active
              </label>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFeeStructure;