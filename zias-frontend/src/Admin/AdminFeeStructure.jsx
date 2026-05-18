// src/Admin/AdminFeeStructure.jsx – with Pending fee details & Week-fee status
import { useEffect, useState } from "react";
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

  // State for pending amounts and week status (by fee structure id)
  const [pendingMap, setPendingMap] = useState({});
  const [weekStatusMap, setWeekStatusMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState({});

  const extractArray = (response) => {
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data : [];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [structuresRes, batchesRes] = await Promise.all([
        API.get("fee-structures/"),
        API.get("batches/"),
      ]);
      const structures = extractArray(structuresRes);
      const batchesData = extractArray(batchesRes);
      setBatches(batchesData);
      const map = {};
      batchesData.forEach(b => { map[b.id] = b.name; });
      setBatchMap(map);
      setFeeStructures(structures);

      // After loading fee structures, fetch pending details & week status for each
      for (const fs of structures) {
        fetchPendingAndStatus(fs.id);
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAndStatus = async (id) => {
    setDetailsLoading(prev => ({ ...prev, [id]: true }));
    try {
      // --- TODO: Replace these with your actual API endpoints ---
      // Example: GET /fee-structures/${id}/pending/ -> returns { pending_amount }
      // Example: GET /fee-structures/${id}/week-status/ -> returns [{ week: 1, status: "Paid" }, ...]
      
      // Mock data for demonstration (remove when backend ready)
      const mockPending = { pending_amount: (Math.random() * 5000).toFixed(2) };
      const mockWeekStatus = [
        { week: 1, status: "Paid" },
        { week: 2, status: Math.random() > 0.5 ? "Paid" : "Pending" },
        { week: 3, status: "Pending" },
      ];

      // Uncomment below when endpoints are ready:
      /*
      const [pendingRes, weekRes] = await Promise.all([
        API.get(`fee-structures/${id}/pending/`),
        API.get(`fee-structures/${id}/week-status/`),
      ]);
      const pendingAmount = pendingRes.data.pending_amount;
      const weekStatus = weekRes.data;
      */
      
      // Using mock data:
      const pendingAmount = mockPending.pending_amount;
      const weekStatus = mockWeekStatus;

      setPendingMap(prev => ({ ...prev, [id]: pendingAmount }));
      setWeekStatusMap(prev => ({ ...prev, [id]: weekStatus }));
    } catch (err) {
      console.error(`Failed to fetch details for ${id}`, err);
      setPendingMap(prev => ({ ...prev, [id]: "Error" }));
      setWeekStatusMap(prev => ({ ...prev, [id]: [] }));
    } finally {
      setDetailsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
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
        toast.success("Updated");
      } else {
        await API.post("fee-structures/", payload);
        toast.success("Created");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", batch: "", total_amount: "", number_of_installments: 1, is_active: true });
      await fetchData(); // refresh all data, including new pending/status
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee structure?")) return;
    try {
      await API.delete(`fee-structures/${id}/`);
      toast.success("Deleted");
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

  // Helper to render week status as badges
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
          <button onClick={fetchData} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">⟳ Refresh</button>
          <button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">+ Add Fee Structure</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editingId ? "Edit" : "New"} Fee Structure</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Fee structure name *"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <select
                value={formData.batch}
                onChange={e => setFormData({ ...formData, batch: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
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
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Number of Installments"
                value={formData.number_of_installments}
                onChange={e => setFormData({ ...formData, number_of_installments: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
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
              <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Batch</th>
              <th className="px-4 py-3 text-left">Total Amount</th>
              <th className="px-4 py-3 text-left">Pending Amount</th>
              <th className="px-4 py-3 text-left">Installments</th>
              <th className="px-4 py-3 text-left">Week-fee Status</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {feeStructures.map(fs => (
              <tr key={fs.id} className="border-t">
                <td className="px-4 py-2">{fs.name || "—"}</td>
                <td className="px-4 py-2">{getBatchName(fs)}</td>
                <td className="px-4 py-2">₹{fs.total_amount}</td>
                <td className="px-4 py-2">
                  {detailsLoading[fs.id] ? (
                    <span className="text-gray-400 text-sm">Loading...</span>
                  ) : (
                    <span className="font-medium text-red-600">
                      ₹{pendingMap[fs.id] !== undefined ? pendingMap[fs.id] : "—"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">{fs.number_of_installments}</td>
                <td className="px-4 py-2">
                  {detailsLoading[fs.id] ? (
                    <span className="text-gray-400 text-sm">Loading...</span>
                  ) : (
                    renderWeekStatus(weekStatusMap[fs.id])
                  )}
                </td>
                <td className="px-4 py-2">{fs.is_active ? "Active" : "Inactive"}</td>
                <td className="px-4 py-2 text-center whitespace-nowrap">
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
                    className="text-blue-600 hover:text-blue-800 mx-1"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(fs.id)}
                    className="text-red-600 hover:text-red-800 mx-1"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note: remove mock data and replace with real API calls when backend is ready */}
      <div className="mt-4 text-xs text-gray-400 text-center border-t pt-2">
        ℹ️ Pending amount & Week status are currently using mock data. 
        Replace <code>fetchPendingAndStatus</code> with real API endpoints.
      </div>
    </div>
  );
}

export default AdminFeeStructure;