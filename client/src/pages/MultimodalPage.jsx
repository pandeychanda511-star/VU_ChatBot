import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Sparkles, 
  Layers, 
  Volume2, 
  FileText, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  ArrowRight, 
  BookOpen, 
  Award, 
  AlertCircle,
  GraduationCap,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function MultimodalPage() {
  const [activeTab, setActiveTab] = useState('flowchart'); // 'flowchart' | 'audio' | 'transcript'
  const [flowchartData, setFlowchartData] = useState(null);
  const [audioList, setAudioList] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Audio Player State
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Transcript Analyzer State
  const [selectedStudentForTranscript, setSelectedStudentForTranscript] = useState('student_a');
  const [transcriptAnalysis, setTranscriptAnalysis] = useState(null);
  const [analyzingTranscript, setAnalyzingTranscript] = useState(false);

  useEffect(() => {
    // Load flowchart data
    fetch('/api/multimodal/course-flow')
      .then(r => r.json())
      .then(d => {
        setFlowchartData(d);
        if (d.semesters && d.semesters[0]?.courses[0]) {
          setSelectedCourse(d.semesters[0].courses[0]);
        }
      })
      .catch(err => console.error('Flowchart fetch error:', err));

    // Load audio regulations
    fetch('/api/multimodal/audio-regulations')
      .then(r => r.json())
      .then(d => {
        if (d.regulations) setAudioList(d.regulations);
      })
      .catch(err => console.error('Audio fetch error:', err));

    // Load default transcript
    runTranscriptAnalysis('student_a');
  }, []);

  const runTranscriptAnalysis = async (studentId) => {
    setSelectedStudentForTranscript(studentId);
    setAnalyzingTranscript(true);
    try {
      const res = await fetch(`/api/students/${studentId}/transcript`);
      if (res.ok) {
        const transcript = await res.json();
        const analyzeRes = await fetch('/api/students/analyze-transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transcript)
        });
        const analysis = await analyzeRes.json();
        setTranscriptAnalysis({ ...analysis, rawTranscript: transcript });
      }
    } catch (err) {
      console.error('Transcript error:', err);
    } finally {
      setAnalyzingTranscript(false);
    }
  };

  // Text-To-Speech Playback Engine
  const handlePlayAudio = (regulation) => {
    if ('speechSynthesis' in window) {
      if (playingAudioId === regulation.id && isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setPlayingAudioId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(regulation.audioScript);
      utterance.rate = playbackRate;
      utterance.onend = () => {
        setIsPlaying(false);
        setPlayingAudioId(null);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setPlayingAudioId(null);
      };

      window.speechSynthesis.speak(utterance);
      setPlayingAudioId(regulation.id);
      setIsPlaying(true);
    } else {
      alert('Speech synthesis is not supported by your browser.');
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setPlayingAudioId(null);
  };

  return (
    <DashboardLayout title="Multimodal Advising Studio">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Banner */}
        <div className="bg-gradient-to-r from-vu-navy via-[#134074] to-vu-navy rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase #8: Multimodal AI Extension</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Multimodal Academic Advising Studio
            </h1>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">
              Extending the advisor beyond text across three rich modalities:
              <span className="font-semibold text-amber-300"> Interactive Course Prerequisite Flowcharts</span>, 
              <span className="font-semibold text-amber-300"> Audio Regulation Briefings</span>, and 
              <span className="font-semibold text-amber-300"> Structured Transcript Document Audits</span>.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-vu-gold/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-xs">
          {[
            { id: 'flowchart', label: '1. Course Prerequisite Flowchart', icon: Layers },
            { id: 'audio', label: '2. Audio Regulations Studio', icon: Volume2 },
            { id: 'transcript', label: '3. Transcript Document Analyzer', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  handleStopAudio();
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                  active ? 'bg-vu-navy text-white shadow-sm' : 'text-slate-600 hover:text-vu-navy hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-vu-gold' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Visual Course Flowchart & Infographic */}
        {activeTab === 'flowchart' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Flowchart Explorer */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">B.Tech CSE Curriculum Prerequisite Flow</h2>
                    <p className="text-xs text-slate-500">Click any course node to generate an interactive Infographic card</p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                    160 Total Credits
                  </span>
                </div>

                <div className="space-y-6">
                  {flowchartData?.semesters.slice(0, 5).map(sem => (
                    <div key={sem.semester} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                        <span>Semester {sem.semester}: {sem.theme}</span>
                        <span className="text-slate-400 text-[11px] font-normal">
                          {sem.courses.reduce((acc, c) => acc + c.credits, 0)} Credits
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {sem.courses.map(course => {
                          const isSelected = selectedCourse?.code === course.code;
                          const hasPrereq = course.prerequisites.length > 0;
                          return (
                            <div
                              key={course.code}
                              onClick={() => setSelectedCourse({ ...course, semester: sem.semester })}
                              className={`p-3 rounded-xl border cursor-pointer transition text-left relative ${
                                isSelected 
                                  ? 'border-vu-gold bg-amber-50/50 shadow-sm ring-2 ring-vu-gold/20' 
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-[10px] font-bold text-vu-blue bg-blue-50 px-1.5 py-0.5 rounded">
                                  {course.code}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400">{course.credits} cr</span>
                              </div>
                              <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{course.name}</h4>
                              {hasPrereq && (
                                <div className="mt-1 text-[9px] text-amber-700 flex items-center gap-1 font-semibold">
                                  <span>Req: {course.prerequisites.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Infographic Card */}
              <div className="lg:col-span-4 space-y-6">
                {selectedCourse ? (
                  <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl p-6 shadow-md border-2 border-vu-gold/30 space-y-4 sticky top-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-vu-gold">Course Infographic</span>
                        <h3 className="font-extrabold text-base text-vu-navy">{selectedCourse.code}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-vu-navy text-vu-gold flex items-center justify-center font-bold">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{selectedCourse.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Category: <strong className="text-slate-700">{selectedCourse.type}</strong> | Semester: <strong className="text-slate-700">{selectedCourse.semester || 1}</strong>
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Credits</span>
                        <div className="text-base font-extrabold text-slate-800">{selectedCourse.credits}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Prerequisites</span>
                        <div className="text-xs font-bold text-amber-600 truncate">
                          {selectedCourse.prerequisites.length > 0 ? selectedCourse.prerequisites.join(', ') : 'None (Nil)'}
                        </div>
                      </div>
                    </div>

                    {/* Dependency Chain Visualization */}
                    <div className="bg-slate-100/70 p-3.5 rounded-xl space-y-2 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Academic Dependency Pathway:
                      </span>
                      {selectedCourse.prerequisites.length > 0 ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <span className="bg-white px-2 py-1 rounded shadow-xs font-mono text-[11px]">
                            {selectedCourse.prerequisites.join(' + ')}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-vu-gold shrink-0" />
                          <span className="bg-vu-navy text-white px-2 py-1 rounded shadow-xs font-mono text-[11px]">
                            {selectedCourse.code}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          This is an entry foundational course with no prior course dependencies.
                        </p>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-3">
                      Authoritative Source: Vidyashilp University B.Tech CSE Semester Spread Structure (Approved BoS).
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-200">
                    Select a course from the curriculum to view its infographic breakdown.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Audio Regulations Studio */}
        {activeTab === 'audio' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {audioList.map(reg => {
                const isThisPlaying = playingAudioId === reg.id && isPlaying;
                return (
                  <div key={reg.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {reg.source}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">~{reg.durationSec}s narration</span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 mb-2">{reg.title}</h3>

                      <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-4 leading-relaxed">
                        "{reg.audioScript}"
                      </p>

                      <div className="space-y-1.5 mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Key Regulations:</span>
                        {reg.keyPoints.map((pt, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlayAudio(reg)}
                          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-sm ${
                            isThisPlaying
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                              : 'bg-vu-navy text-white hover:bg-[#134074]'
                          }`}
                        >
                          {isThisPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause Audio</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 text-vu-gold" />
                              <span>Listen to Regulation</span>
                            </>
                          )}
                        </button>

                        {isThisPlaying && (
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-4 bg-vu-gold animate-pulse rounded-full" />
                            <span className="w-1.5 h-6 bg-vu-gold animate-pulse delay-75 rounded-full" />
                            <span className="w-1.5 h-3 bg-vu-gold animate-pulse delay-150 rounded-full" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>Speed:</span>
                        {[1, 1.25].map(rate => (
                          <button
                            key={rate}
                            onClick={() => setPlaybackRate(rate)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              playbackRate === rate ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Academic Transcript Document Analyzer */}
        {activeTab === 'transcript' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Selector */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Synthetic Student Transcript
                </h3>

                <div className="space-y-2">
                  {[
                    { id: 'student_a', name: 'Student A (Good Standing - 72 credits)', desc: 'Passed all core courses. Seeking elective advising.' },
                    { id: 'student_b', name: 'Student B (Academic Warning - Backlogs)', desc: 'Failed CSEN102 Data Structures and CSEN204 EDA.' }
                  ].map(st => (
                    <button
                      key={st.id}
                      onClick={() => runTranscriptAnalysis(st.id)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition ${
                        selectedStudentForTranscript === st.id
                          ? 'border-vu-gold bg-amber-50/50 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-slate-900 mb-1">{st.name}</div>
                      <p className="text-[11px] text-slate-500 leading-snug">{st.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
                  <strong>Multimodal Ingestion Note:</strong> Analyzes raw grade matrices, calculates credit sums, verifies minimum progression thresholds, and generates remedial guidance.
                </div>
              </div>

              {/* Right Analysis Breakdown */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                {analyzingTranscript ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    Parsing and analyzing transcript records...
                  </div>
                ) : transcriptAnalysis ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-vu-gold">Transcript Analysis Report</span>
                        <h3 className="text-lg font-extrabold text-slate-900">{transcriptAnalysis.studentName}</h3>
                        <p className="text-xs text-slate-500">{transcriptAnalysis.degree}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold self-start ${
                        transcriptAnalysis.failedCoursesCount === 0 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {transcriptAnalysis.academicStanding}
                      </span>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Passed Credits</span>
                        <div className="text-lg font-extrabold text-slate-900">{transcriptAnalysis.passedCredits} / 160</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Cumulative CGPA</span>
                        <div className="text-lg font-extrabold text-vu-blue">{transcriptAnalysis.cumulativeCGPA}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Passed Courses</span>
                        <div className="text-lg font-extrabold text-emerald-600">{transcriptAnalysis.passedCoursesCount}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Failed Backlogs</span>
                        <div className={`text-lg font-extrabold ${transcriptAnalysis.failedCoursesCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {transcriptAnalysis.failedCoursesCount}
                        </div>
                      </div>
                    </div>

                    {/* Backlog Alert if any */}
                    {transcriptAnalysis.failedCourses && transcriptAnalysis.failedCourses.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs">
                        <div className="flex items-center gap-2 text-red-800 font-bold mb-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span>Active Course Backlogs Requiring Remedial Registration:</span>
                        </div>
                        <ul className="space-y-1 text-red-700">
                          {transcriptAnalysis.failedCourses.map((f, i) => (
                            <li key={i}>
                              • <strong>{f.code}</strong> - {f.name} ({f.credits} Credits, Semester {f.semester})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Progression Decision */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-1">
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span>Year 3 Progression Eligibility:</span>
                        <span className={`font-bold ${transcriptAnalysis.progressionStatus.eligibleForYear3 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {transcriptAnalysis.progressionStatus.eligibleForYear3 ? 'ELIGIBLE' : 'BLOCKED BY PREREQUISITE BACKLOGS'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">{transcriptAnalysis.progressionStatus.progressionRule}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

