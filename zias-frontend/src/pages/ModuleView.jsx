import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

function ModuleView() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper: convert plain text to HTML (paragraphs + unordered lists)
  const formatTextToHtml = (text) => {
    if (!text) return "";
    if (/<[^>]*>/.test(text)) return text;

    const lines = text.split(/\r?\n/);
    const result = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().match(/^[-*]\s+/)) {
        const listItems = [];
        while (i < lines.length && lines[i].trim().match(/^[-*]\s+/)) {
          let itemText = lines[i].trim().replace(/^[-*]\s+/, "");
          if (itemText.includes("http")) {
            itemText = itemText.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">$1</a>');
          }
          listItems.push(`<li>${itemText}</li>`);
          i++;
        }
        result.push(`<ul class="list-disc pl-6 my-2">${listItems.join("")}</ul>`);
      } else if (line.trim() === "") {
        i++;
        continue;
      } else {
        let para = line.trim();
        while (i + 1 < lines.length && lines[i + 1].trim() !== "" && !lines[i + 1].trim().match(/^[-*]\s+/)) {
          i++;
          para += " " + lines[i].trim();
        }
        para = para.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">$1</a>');
        result.push(`<p class="my-2">${para}</p>`);
        i++;
      }
    }
    return result.join("");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch module details
        const modRes = await API.get(`modules/${moduleId}/`);
        setModule(modRes.data);

        // ✅ Use me endpoint to get student profile
        const userRes = await API.get("users/me/");
        const user = userRes.data;
        if (user.is_student) {
          const studentRes = await API.get("students/me/");
          setStudent(studentRes.data);
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setError("You are not enrolled in this course.");
        } else {
          setError("Failed to load module content.");
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [moduleId]);

  if (loading) return <div className="min-h-screen bg-[#0f1623] text-white flex items-center justify-center">Loading...</div>;
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1623] text-white flex flex-col items-center justify-center">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button onClick={() => navigate("/user/dashboard")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          Go to My Learning
        </button>
      </div>
    );
  }
  if (!module) return <div className="min-h-screen bg-[#0f1623] text-white flex items-center justify-center">Module not found.</div>;

  return (
    <div className="min-h-screen bg-[#0f1623] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{module.title}</h1>
          <p className="text-white/60">Course: {module.course_name || "Full Stack Bootcamp"}</p>
          {student && (
            <div className="mt-4 p-4 bg-[#1a2538] rounded-lg border border-white/10">
              <p><strong>Student Name:</strong> {student.user?.username || student.username}</p>
              <p><strong>Mobile:</strong> {student.phone || "Not provided"}</p>
            </div>
          )}
        </div>

        {/* Week at a Glance */}
        <div className="mb-8 p-6 bg-[#1a2538] rounded-xl border border-white/10">
          <h2 className="text-2xl font-semibold mb-4">📦 Week at a Glance</h2>
          <div className="prose prose-invert max-w-none text-white/90" dangerouslySetInnerHTML={{ __html: formatTextToHtml(module.content) }} />
        </div>

        {/* Days Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🗓️ Week Breakdown</h2>
          <div className="space-y-6">
            {module.days && module.days.length > 0 ? (
              module.days.map((day) => (
                <div key={day.id} className="bg-[#1a2538] rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-white/10 bg-[#0f1623]">
                    <h3 className="text-xl font-semibold">{day.title}</h3>
                  </div>
                  <div className="p-4">
                    <div className="prose prose-invert max-w-none text-white/90" dangerouslySetInnerHTML={{ __html: formatTextToHtml(day.content) }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/40">No days available for this week.</p>
            )}
          </div>
        </div>

        {/* End of Week message */}
        <div className="text-center mt-8 pt-4 border-t border-white/10">
          <p className="text-white/70 italic">“Discomfort is the currency of growth.” – Keep building! 🚀</p>
        </div>

        <button onClick={() => navigate(-1)} className="mt-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
          ← Back
        </button>
      </div>
    </div>
  );
}

export default ModuleView;