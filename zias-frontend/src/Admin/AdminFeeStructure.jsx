import { useEffect, useState, useRef, useCallback } from "react";
import API from "../api/api";
import toast from "react-hot-toast";

function AdminFeeStructure() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchMap, setBatchMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    batch: "",
    total_amount: "",
    number_of_installments: 1,
    is_active: true,
  });

  const initialFetchDone = useRef(false);
  const batchesFetched = useRef(false);

  const extractArray = (response) => {
    const data = response.data?.results || response.data;
    return Array.isArray(data) ? data : [];
  };

  const generateWeekStatus = (feeStructure) => {
    const numberOfInstallments = feeStructure.number_of_installments || 1;
    const totalAmount = parseFloat(feeStructure.total_amount) || 0;
    const perInstallmentAmount = totalAmount / numberOfInstallments;
    
    const weekStatuses = [];
    for (let week = 1; week <= numberOfInstallments; week++) {
      weekStatuses.push({
        week: week,
        status: "Pending",
        amount: perInstallmentAmount,
      });
    }
    return weekStatuses;
  };

  const fetchBatches = useCallback(async () => {
    if (batchesFetched.current) return;
    batchesFetched.current = true;
    try {
      const batchesRes = await API.get("batches/");
      const batchesData = extractArray(batchesRes);
      setBatches(batchesData);
      const map = {};
      batchesData.forEach(b => { map[b.id] = b.name; });
      setBatchMap(map);
    } catch (err) {
      console.error("Failed to load batches:", err);
      toast.error("Failed to load batches");
    }
  }, []);

  const fetchFeeStructures = useCallback(async () => {
    try {
      const structuresRes = await API.get("fee-structures/");
      const structures = extractArray(structuresRes);
      
      const processedStructures = structures.map(fs => ({
        ...fs,
        week_status: generateWeekStatus(fs),
        per_installment: (parseFloat(fs.total_amount) || 0) / (fs.number_of_installments || 1),
      }));
      
      setFeeStructures(processedStructures);
      return processedStructures;
    } catch (err) {
      console.error("Failed to load fee structures:", err);
      toast.error("Failed to load fee structures");
      return [];
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchFeeStructures(), fetchBatches()]);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchFeeStructures, fetchBatches]);

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Fee structure name is required");
      return;
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }
    if (!formData.number_of_installments || parseInt(formData.number_of_installments) < 1) {
      toast.error("Number of installments must be at least 1");
      return;
    }
    
    try {
      const payload = {
        name: formData.name.trim(),
        batch: formData.batch ? parseInt(formData.batch) : null,
        total_amount: parseFloat(formData.total_amount),
        number_of_installments: parseInt(formData.number_of_installments),
        is_active: formData.is_active,
      };
      
      if (editingId) {
        await API.patch(`fee-structures/${editingId}/`, payload);
        toast.success("Updated successfully");
      } else {
        await API.post("fee-structures/", payload);
        toast.success("Created successfully");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", batch: "", total_amount: "", number_of_installments: 1, is_active: true });
      await fetchData();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.detail || err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee structure?")) return;
    try {
      await API.delete(`fee-structures/${id}/`);
      toast.success("Deleted successfully");
      await fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Delete failed");
    }
  };

  const toggleActiveStatus = async (fs) => {
    const newStatus = !fs.is_active;
    
    const previousStructures = [...feeStructures];
    
    setFeeStructures(prevStructures => 
      prevStructures.map(item => 
        item.id === fs.id 
          ? { ...item, is_active: newStatus }
          : item
      )
    );
    
    try {
      const response = await API.patch(`fee-structures/${fs.id}/`, { is_active: newStatus });
      
      setFeeStructures(prevStructures => 
        prevStructures.map(item => 
          item.id === fs.id 
            ? { ...item, ...response.data, week_status: generateWeekStatus(response.data) }
            : item
        )
      );
      toast.success(`Fee structure ${newStatus ? "activated" : "deactivated"} successfully`);
      
    } catch (err) {
      console.error("Status update error:", err);
      setFeeStructures(previousStructures);
      toast.error(`Failed to update status: ${err.response?.data?.detail || err.message}`);
    }
  };

  const getBatchName = (fs) => {
    if (fs.batch && typeof fs.batch === 'object' && fs.batch.name) return fs.batch.name;
    if (fs.batch_id && batchMap[fs.batch_id]) return batchMap[fs.batch_id];
    if (fs.batch && batchMap[fs.batch]) return batchMap[fs.batch];
    return "—";
  };

  const renderWeekStatus = (statuses) => {
    if (!statuses || statuses.length === 0) return "—";
    return (
      <div className="flex flex-col gap-1">
        {statuses.map((item, idx) => (
          <span
            key={idx}
            className="inline-block text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800"
          >
            Week {item.week}: Pending (₹{item.amount.toLocaleString()})
          </span>
        ))}
      </div>
    );
  };

  const totalFees = feeStructures.reduce((sum, fs) => {
    const amount = parseFloat(fs.total_amount) || 0;
    return sum + amount;
  }, 0);

  if (loading) {
    return (
      <div className="p-8 text-center flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading fee structures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fee Structure</h1>
          <p className="text-sm text-gray-500 mt-1">Manage course fees and installment schedules</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData} 
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
          >
            ⟳ Refresh
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ name: "", batch: "", total_amount: "", number_of_installments: 1, is_active: true });
              setShowForm(true);
            }} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            + Add Fee Structure
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm">Total Fee Structures</p>
          <p className="text-2xl font-bold text-gray-800">{feeStructures.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm">Total Course Fees</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{totalFees.toLocaleString()}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editingId ? "Edit" : "New"} Fee Structure</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure Name *</label>
                <input
                  type="text"
                  placeholder="e.g., B.Tech 2024 - Semester 1"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Example: B.Tech 2024, MBA Semester 1, etc.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <select
                  value={formData.batch}
                  onChange={e => setFormData({ ...formData, batch: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                >
                  <option value="">Select Batch (optional)</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 50000"
                  value={formData.total_amount}
                  onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Installments (Weeks) *</label>
                <input
                  type="number"
                  placeholder="e.g., 12"
                  value={formData.number_of_installments}
                  onChange={e => setFormData({ ...formData, number_of_installments: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                  min="1"
                  required
                />
                {formData.total_amount && formData.number_of_installments && (
                  <p className="text-xs text-green-600 mt-1">
                    💡 Each installment = ₹{(parseFloat(formData.total_amount) / parseInt(formData.number_of_installments)).toFixed(2)} per week
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
            </div>
            <div className="flex gap-2 mt-6">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition">
                {editingId ? "Update" : "Create"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Batch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Installments</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Week-fee Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {feeStructures.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-gray-500">
                  No fee structures found. Click "Add Fee Structure" to create one.
                </td>
              </tr>
            ) : (
              feeStructures.map(fs => {
                const totalAmount = parseFloat(fs.total_amount) || 0;
                const numInstallments = fs.number_of_installments || 1;
                const perWeek = totalAmount / numInstallments;
                
                return (
                  <tr key={fs.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{fs.name || "—"}</p>
                        <p className="text-xs text-gray-400">ID: {fs.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{getBatchName(fs)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">₹{totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-800">{numInstallments} weeks</span>
                        <span className="block text-xs text-gray-400">
                          ₹{perWeek.toLocaleString()}/week
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {renderWeekStatus(fs.week_status)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActiveStatus(fs)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                          fs.is_active 
                            ? "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200" 
                            : "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200"
                        }`}
                      >
                        {fs.is_active ? "✓ Active" : "✗ Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(fs.id);
                            const batchId = fs.batch?.id || fs.batch_id || fs.batch;
                            setFormData({
                              name: fs.name || "",
                              batch: batchId?.toString() || "",
                              total_amount: fs.total_amount,
                              number_of_installments: fs.number_of_installments || 1,
                              is_active: fs.is_active,
                            });
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(fs.id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">📚 Understanding Fee Structure</h3>
        <div className="text-xs text-blue-700 space-y-1">
          <p><strong>Installments:</strong> Number of weeks the total fee is divided into. Example: ₹10,000 total with 4 installments = ₹2,500 per week.</p>
          <p><strong>Week-fee Status:</strong> Shows payment status for each week/installment. All weeks start as "Pending" until payments are recorded.</p>
          <p><strong>Total Amount:</strong> The complete course fee.</p>
          <p><strong>Status:</strong> Click on the status badge to toggle between Active/Inactive.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminFeeStructure;