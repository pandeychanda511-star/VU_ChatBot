import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  ExternalLink, 
  GraduationCap, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  Trash2,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  BookOpen,
  Award,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const GRADE_OPTIONS = [
  'A+',
  'A',
  'B+',
  'B',
  'C',
  'D',
  'E',
  'Fail / Backlog'
];

export default function StudentsDirectoryPage() {
  const { getIdToken } = useAuth() || {};
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [expandedSemesters, setExpandedSemesters] = useState({ 1: true, 8: true });

  // Academic Management Grade Editing state
  const [semesterGrades, setSemesterGrades] = useState({});
  const [savingSem, setSavingSem] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState(null);

  // Profile Edit modal
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', programme: '', admissionCohort: '' });

  // Delete modal
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      const list = data.students || [];
      setStudents(list);
      if (list.length > 0) {
        // Keep currently selected or pick first
        setSelectedStudent(prev => {
          if (!prev) return list[0];
          const found = list.find(s => s.id === prev.id);
          return found || list[0];
        });
      } else {
        setSelectedStudent(null);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load students directory:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Sync current grades whenever selected student changes
  useEffect(() => {
    if (selectedStudent && selectedStudent.semesters) {
      const gradesObj = {};
      selectedStudent.semesters.forEach(s => {
        gradesObj[s.semester] = {};
        (s.courses || []).forEach(c => {
          gradesObj[s.semester][c.courseCode] = c.grade;
        });
      });
      setSemesterGrades(gradesObj);
      setProfileForm({
        fullName: selectedStudent.fullName || selectedStudent.name,
        programme: selectedStudent.programme || selectedStudent.program,
        admissionCohort: selectedStudent.admissionCohort || '2024'
      });
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
    }
  }, [selectedStudent?.id]);

  const toggleSemester = (semNum) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [semNum]: !prev[semNum]
    }));
  };

  const handleGradeChange = (semester, courseCode, grade) => {
    setSemesterGrades(prev => ({
      ...prev,
      [semester]: {
        ...(prev[semester] || {}),
        [courseCode]: grade
      }
    }));
  };

  const handleSaveSemesterGrades = async (semNum) => {
    if (semNum === 8) return;
    setSavingSem(semNum);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const token = getIdToken ? await getIdToken() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/students/${selectedStudent.id}/grades`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          semester: semNum,
          grades: semesterGrades[semNum] || {}
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update semester grades.');
      }

      setSaveSuccessMsg(`Semester ${semNum} grades saved successfully! SGPA updated.`);
      await fetchStudents();
    } catch (err) {
      setSaveErrorMsg(err.message);
    } finally {
      setSavingSem(null);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const token = getIdToken ? await getIdToken() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');

      setEditingProfile(false);
      await fetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteStudent = async () => {
    if (deleteConfirmText !== deletingStudent.uun) {
      alert(`Please type "${deletingStudent.uun}" to confirm permanent deletion.`);
      return;
    }

    setDeleteLoading(true);
    try {
      const token = getIdToken ? await getIdToken() : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/students/${deletingStudent.id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete student.');

      setDeletingStudent(null);
      setDeleteConfirmText('');
      await fetchStudents();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredStudents = students.filter(st => {
    const q = searchTerm.toLowerCase();
    return (
      (st.fullName && st.fullName.toLowerCase().includes(q)) ||
      (st.name && st.name.toLowerCase().includes(q)) ||
      (st.uun && st.uun.toLowerCase().includes(q)) ||
      (st.email && st.email.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout title="Dynamic Student Directory & Academic Management">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-vu-navy via-[#133e6f] to-vu-navy rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Academic Management System</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Student Directory &amp; Semester-wise Grade Control
            </h2>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">
              Fully database-driven student directory. Manage Semesters 1 to 7 grades with real-time SGPA calculation,
              inspect locked Semester 8 upcoming curriculum, and synchronize dynamic Grade Card image generation for chatbot responses.
            </p>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 hidden md:block pointer-events-none">
            <Users className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student full name or UUN (e.g. Nitin Kumar, UUN01)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vu-gold/40 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Total Registered Students: <strong>{students.length}</strong>
            </span>
            <button
              onClick={fetchStudents}
              title="Refresh Directory"
              className="p-2 text-slate-500 hover:text-vu-navy hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Students List Directory */}
          <div className="lg:col-span-4 space-y-2.5 max-h-[850px] overflow-y-auto pr-1">
            {loading ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
                Loading students database...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-xs border border-slate-200 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-700">No registered students found.</p>
                <p className="text-[11px] text-slate-400">Whenever a new student registers with their UUN, they will appear dynamically here.</p>
              </div>
            ) : (
              filteredStudents.map(st => {
                const isSelected = selectedStudent?.id === st.id;
                const hasBacklog = st.failedCourses && st.failedCourses.length > 0;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudent(st)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between text-left ${
                      isSelected
                        ? 'border-vu-gold bg-amber-50/50 shadow-sm ring-2 ring-vu-gold/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 truncate">
                          {st.fullName || st.name}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-vu-blue bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                          {st.uun}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {st.programme || st.program} • {st.cohort}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          CGPA: {st.cgpa}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          hasBacklog ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {hasBacklog ? 'Backlogs' : 'Good Standing'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Academic Management Interface */}
          <div className="lg:col-span-8 space-y-6">
            {selectedStudent ? (
              <>
                {/* Profile Header Box & CRUD Actions */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-vu-gold tracking-wider">
                        Authenticated Student Profile
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        {selectedStudent.fullName || selectedStudent.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        UUN: <strong className="text-vu-blue">{selectedStudent.uun}</strong> • {selectedStudent.programme || selectedStudent.program} • {selectedStudent.cohort}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingStudent(selectedStudent)}
                        className="px-3 py-1.5 rounded-xl border border-red-200 text-xs font-bold text-red-600 bg-red-50/60 hover:bg-red-100 flex items-center gap-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                      <a
                        href={`/api/students/${selectedStudent.id}/card-pdf`}
                        download
                        className="px-3 py-1.5 rounded-xl bg-vu-navy text-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-800 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                      <a
                        href={`/api/students/${selectedStudent.id}/card-image`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-200 transition"
                      >
                        <span>SVG</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cumulative CGPA</span>
                      <span className="text-xl font-black text-vu-navy">{selectedStudent.cgpa}</span>
                      <span className="text-[10px] text-slate-400 block">/ 10.00</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Credits Completed</span>
                      <span className="text-xl font-black text-emerald-700">{selectedStudent.completedCredits}</span>
                      <span className="text-[10px] text-slate-400 block">Earned</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Credits Remaining</span>
                      <span className="text-xl font-black text-amber-700">{selectedStudent.remainingCredits}</span>
                      <span className="text-[10px] text-slate-400 block">Pending</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Academic Standing</span>
                      <span className={`text-xs font-bold block mt-1 ${
                        selectedStudent.failedCourses?.length > 0 ? 'text-red-700' : 'text-emerald-700'
                      }`}>
                        {selectedStudent.standing}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}
                {saveErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{saveErrorMsg}</span>
                  </div>
                )}

                {/* Eight Semester Sections Accordion */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                      Semester-wise Academic Management (Semesters 1 to 8)
                    </h4>
                    <span className="text-xs text-slate-500">
                      Curriculum: <strong>{selectedStudent.cohort}</strong>
                    </span>
                  </div>

                  {Array.from({ length: 8 }, (_, i) => i + 1).map(semNum => {
                    const isSem8 = semNum === 8;
                    const semData = (selectedStudent.semesters || []).find(s => s.semester === semNum) || {
                      semester: semNum,
                      sgpa: 3.5,
                      totalCredits: 20,
                      courses: []
                    };
                    const isExpanded = !!expandedSemesters[semNum];
                    const courses = semData.courses || [];

                    return (
                      <div
                        key={semNum}
                        className={`bg-white rounded-3xl border shadow-xs overflow-hidden transition ${
                          isSem8 ? 'border-purple-200 bg-purple-50/10' : 'border-slate-200'
                        }`}
                      >
                        {/* Semester Header */}
                        <div
                          onClick={() => toggleSemester(semNum)}
                          className={`p-4 flex items-center justify-between cursor-pointer select-none ${
                            isSem8 ? 'bg-purple-50/60 hover:bg-purple-50' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                              isSem8 ? 'bg-purple-700 text-white' : 'bg-vu-navy text-vu-gold'
                            }`}>
                              S{semNum}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900">
                                  Semester {semNum}
                                </span>
                                {isSem8 ? (
                                  <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" />
                                    Upcoming
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                    SGPA: {semData.sgpa !== null ? semData.sgpa.toFixed(2) : 'N/A'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {isSem8 ? (
                                  'Not Started • Locked in Next Academic Cycle'
                                ) : (
                                  `${courses.length} Official Courses • ${semData.totalCredits} Total Credits`
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="p-4 border-t border-slate-100 space-y-4">
                            {isSem8 ? (
                              /* Semester 8: UPCOMING Locked Table */
                              <div className="space-y-3">
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900 flex items-center gap-2">
                                  <Lock className="w-4 h-4 text-purple-700 shrink-0" />
                                  <span>
                                    <strong>Semester 8 is marked as UPCOMING:</strong> The official course structure is shown below from the university curriculum document. Grades cannot be assigned until the semester is active.
                                  </span>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-purple-200 bg-white">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-purple-100/70 text-purple-900 font-bold border-b border-purple-200 text-[11px]">
                                      <tr>
                                        <th className="py-2.5 px-3">Course Code</th>
                                        <th className="py-2.5 px-3">Course Name</th>
                                        <th className="py-2.5 px-3 text-right">Credits</th>
                                        <th className="py-2.5 px-3 text-center">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-purple-100">
                                      {courses.map((c, idx) => (
                                        <tr key={idx} className="hover:bg-purple-50/40">
                                          <td className="py-2.5 px-3 font-mono font-bold text-purple-950">{c.courseCode}</td>
                                          <td className="py-2.5 px-3 font-semibold text-slate-800">{c.courseName}</td>
                                          <td className="py-2.5 px-3 text-right font-semibold text-slate-600">{c.credits}</td>
                                          <td className="py-2.5 px-3 text-center">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-md">
                                              <Lock className="w-2.5 h-2.5" />
                                              Upcoming
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              /* Semesters 1 to 7: Editable Grade Table */
                              <div className="space-y-3">
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                                      <tr>
                                        <th className="py-2.5 px-3">Course Code</th>
                                        <th className="py-2.5 px-3">Official Course Name</th>
                                        <th className="py-2.5 px-3 text-right">Credits</th>
                                        <th className="py-2.5 px-3 text-right">Grade</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {courses.map((c, idx) => {
                                        const currentVal = semesterGrades[semNum]?.[c.courseCode] || c.grade || 'A';
                                        return (
                                          <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3 font-mono font-bold text-vu-navy">{c.courseCode}</td>
                                            <td className="py-2 px-3 font-medium text-slate-800">{c.courseName}</td>
                                            <td className="py-2 px-3 text-right font-semibold text-slate-600">{c.credits}</td>
                                            <td className="py-2 px-3 text-right">
                                              <select
                                                value={currentVal}
                                                onChange={(e) => handleGradeChange(semNum, c.courseCode, e.target.value)}
                                                className="px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-vu-navy cursor-pointer"
                                              >
                                                {GRADE_OPTIONS.map(opt => (
                                                  <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                              </select>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => handleSaveSemesterGrades(semNum)}
                                    disabled={savingSem === semNum}
                                    className="bg-vu-navy hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                                  >
                                    <Save className="w-3.5 h-3.5 text-vu-gold" />
                                    <span>{savingSem === semNum ? 'Saving...' : `Save Semester ${semNum} Grades`}</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
                Please select a student from the directory to manage their academic results.
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {editingProfile && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">Edit Student Profile</h3>
                <button onClick={() => setEditingProfile(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-vu-blue"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Programme</label>
                  <input
                    type="text"
                    value={profileForm.programme}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, programme: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-vu-blue"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Admission Cohort</label>
                  <select
                    value={profileForm.admissionCohort}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, admissionCohort: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-vu-blue"
                  >
                    <option value="2024">2024 Batch</option>
                    <option value="2023">2023 Batch</option>
                    <option value="2022">2022 Batch</option>
                    <option value="2025">2025 Batch</option>
                    <option value="2026 Data Science">2026 Data Science Batch</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-vu-navy text-amber-400 font-bold hover:bg-slate-800"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingStudent && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-red-200">
              <div className="flex items-center gap-3 text-red-600 border-b border-red-100 pb-3">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-extrabold">Permanent Student Deletion</h3>
              </div>

              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  You are about to permanently delete <strong>{deletingStudent.fullName || deletingStudent.name}</strong> (UUN: <code>{deletingStudent.uun}</code>).
                </p>
                <p className="text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  <strong>Warning:</strong> All associated academic results for Semesters 1 to 7, student database records, and authentication links will be deleted. This action cannot be undone.
                </p>
                <p>
                  Please type the student's UUN <code>{deletingStudent.uun}</code> below to confirm:
                </p>
                <input
                  type="text"
                  placeholder={deletingStudent.uun}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.trim().toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setDeletingStudent(null); setDeleteConfirmText(''); }}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  disabled={deleteConfirmText !== deletingStudent.uun || deleteLoading}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 text-xs disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
