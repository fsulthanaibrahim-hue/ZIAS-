// src/pages/student/StudentModules.jsx – optimized (no duplicate API calls)
import React, { useState, useEffect, useRef } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import API from "../../api/api";
import { Link } from "react-router-dom";

function StudentModules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const fetchMyModules = async () => {
      setLoading(true);
      try {
        const res = await API.get("/modules/student-modules/");
        let data = res.data.results || res.data;
        if (!Array.isArray(data)) data = [];
        setModules(data);
      } catch (err) {
        console.error(err);
        setError("Could not load your modules.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyModules();
  }, []);

  const filteredModules = modules.filter(mod =>
    mod.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mod.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-red-500 p-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <StudentSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">📘 My Modules</h1>
            <p className="text-gray-500 text-sm mt-1">
              Modules unlock as you complete weekly reviews.
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-6 relative max-w-md">
            <input
              type="text"
              placeholder="Search modules by title or content..."
              className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Modules grid – exactly like mentor module grid */}
          {filteredModules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-500">
                {searchTerm ? "No modules match your search." : "No modules available for you."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.map((mod) => {
                const isLocked = mod.is_locked === true;
                return (
                  <div
                    key={mod.id}
                    className={`group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                      isLocked ? "opacity-75" : ""
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg line-clamp-1">
                            {mod.title}
                          </h3>
                          {mod.course_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              {mod.is_common ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  Foundation Module
                                </span>
                              ) : (
                                <span>Course: {mod.course_name}</span>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="ml-3">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                              Unlocked
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {mod.content || "No description available."}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <Link
                          to={`/student/module/${mod.id}`}
                          className={`text-sm font-medium px-4 py-1.5 rounded-full transition ${
                            !isLocked
                              ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                          }`}
                        >
                          {!isLocked ? "View Module →" : "Locked"}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentModules;