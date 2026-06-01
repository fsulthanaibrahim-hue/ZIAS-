import { useEffect, useState, useRef } from "react";
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
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data : [];
  };

  // Calculate pending amount based on payments (if payments data is included in fee structure response)
  const calculatePendingAmount = (feeStructure) => {
    if (!feeStructure.total_amount) return 0;
    const totalPaid = feeStructure.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    return feeStructure.total_amount - totalPaid;
  };

  // Generate week status based on number of installments
  const generateWeekStatus = (feeStructure) => {
    const numberOfInstallments = feeStructure.number_of_installments || 1;
    const payments = feeStructure.payments || [];
    
    const weekStatuses = [];
    for (let week = 1; week <= numberOfInstallments; week++) {
      const paymentForWeek = payments.find(p => p.week_number === week);
      weekStatuses.push({
        week: week,
        status: paymentForWeek?.paid_date ? "Paid" : "Pending",
        amount: paymentForWeek?.amount || 0,
        due_date: paymentForWeek?.due_date || null,
        paid_date: paymentForWeek?.paid_date || null,
      });
    }
    return weekStatuses;
  };

  const fetchBatches = async () => {
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
    }
  };

  const fetchFeeStructures = async () => {
    try {
      const structuresRes = await API.get("fee-structures/");
      const structures = extractArray(structuresRes);
      
      // Process fee structures with calculated data
      const processedStructures = structures.map(fs => ({
        ...fs,
        pending_amount: calculatePendingAmount(fs),
        week_status: generateWeekStatus(fs),
      }));
      
      setFeeStructures(processedStructures);
    } catch (err) {
      toast.error("Failed to load fee structures");
      console.error(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchFeeStructures(), fetchBatches()]);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
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
      toast.error(err.response?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee structure?")) return;
    try {
      await API.delete(`fee-structures/${id}/`);
      toast.success("Deleted successfully");
      await fetchData();
    } catch (err) {
      toast.error("Delete failed");
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
            className={`inline-block text-xs px-2 py-0.5 rounded-full ${
              item.status === "Paid"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            Week {item.week}: {item.status}
          </span>
        ))}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fee Structure</h1>
        <div className="flex gap-2">
          <button onClick={fetchData} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition">
            ⟳ Refresh
          </button>
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            + Add Fee Structure
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editingId ? "Edit" : "New"} Fee Structure</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Fee structure name *"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                required
              />
              <select
                value={formData.batch}
                onChange={e => setFormData({ ...formData, batch: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              >
                <option value="">Select Batch (optional)</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Total Amount *"
                value={formData.total_amount}
                onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                required
              />
              <input
                type="number"
                placeholder="Number of Installments"
                value={formData.number_of_installments}
                onChange={e => setFormData({ ...formData, number_of_installments: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                min="1"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span>Active</span>
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition">
                Save
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Installments</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Week-fee Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {feeStructures.map(fs => (
              <tr key={fs.id} className="border-t hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-800">{fs.name || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{getBatchName(fs)}</td>
                <td className="px-4 py-3 font-medium text-gray-800">₹{fs.total_amount}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-red-600">
                    ₹{fs.pending_amount?.toFixed(2) || "0.00"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{fs.number_of_installments}</td>
                <td className="px-4 py-3">
                  {renderWeekStatus(fs.week_status)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    fs.is_active 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {fs.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => {
                      setEditingId(fs.id);
                      const batchId = fs.batch?.id || fs.batch_id || fs.batch;
                      setFormData({
                        name: fs.name || "",
                        batch: batchId?.toString() || "",
                        total_amount: fs.total_amount,
                        number_of_installments: fs.number_of_installments,
                        is_active: fs.is_active,
                      });
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 mx-1 transition"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(fs.id)}
                    className="text-red-600 hover:text-red-800 mx-1 transition"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {feeStructures.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-12 text-gray-500">
                  No fee structures found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminFeeStructure;