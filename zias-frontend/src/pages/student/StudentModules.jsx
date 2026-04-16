// src/components/StudentModules.jsx
import { Link } from "react-router-dom";

function StudentModules({ modules }) {
  if (modules.length === 0) {
    return <p className="text-[#7d8590]">No modules assigned to you yet.</p>;
  }

  return (
    <div className="space-y-4">
      {modules.map((mod) => (
        <div
          key={mod.id}
          className="bg-[#161b22] rounded-xl border border-[#21262d] p-5 hover:bg-[#1a2538] transition"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#e6edf3]">{mod.title}</h3>
              <p className="text-[#7d8590] text-sm mt-1">
                {mod.content || "No description"}
              </p>
              {mod.is_common && (
                <span className="inline-block mt-2 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                  Foundation Module
                </span>
              )}
            </div>
            <Link
              to={`/module/${mod.id}`}
              className="bg-[#238636] hover:bg-[#2ea043] px-4 py-2 rounded-lg text-sm font-medium transition ml-4"
            >
              View Module
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StudentModules;