import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Image as ImageIcon,
  ExternalLink,
  Download
} from 'lucide-react';
import SourceCitation from './SourceCitation.jsx';
import ExcelViewerModal from './ExcelViewerModal.jsx';
import PdfViewerModal from './PdfViewerModal.jsx';
import { useAuth } from '../context/AuthContext';

export default function Chatbot({ standalone = false }) {
  const { getIdToken } = useAuth() || {};
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hi! I'm the Academic Advisor chatbot of Vidyashilp University. How may I help you with your academic regulations, course prerequisites, or graduation requirements?",
      citations: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedCitation, setSelectedCitation] = useState(null);

  // Assignment 1 & 2 Controls: Profile, Mode, Speech
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [advisingMode, setAdvisingMode] = useState('rag'); // 'rag' | 'agentic'
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [expandedTraceId, setExpandedTraceId] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkHealth();
    // Fetch synthetic students
    fetch('/api/students')
      .then(r => r.json())
      .then(d => {
        if (d.students) setStudents(d.students);
      })
      .catch(err => console.error('Failed to load students:', err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const checkHealth = async () => {
    setBackendStatus('checking');
    setErrorMessage(null);
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      const data = await response.json();
      if (data.status === 'ok') {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
        setErrorMessage('Invalid response from health check');
      }
    } catch (err) {
      console.error('Health check error:', err);
      setBackendStatus('error');
      setErrorMessage(err.message || 'Cannot reach backend service');
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setErrorMessage(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const endpoint = advisingMode === 'agentic' ? '/api/agentic/advise' : '/api/chat/message';

      const token = getIdToken ? await getIdToken() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: query,
          studentProfileId: selectedStudentId || null,
          mode: advisingMode
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (HTTP ${res.status})`);
      }

      const data = await res.json();
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply,
        citations: data.citations || [],
        mediaAttachment: data.mediaAttachment || null,
        missingNote: data.missingInformationNote,
        followUpQuestion: data.followUpQuestion,
        agentTrace: data.agentTrace || null,
        metrics: data.metrics || null,
        status: data.status,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const isAbort = err.name === 'AbortError';
      const errMsg = isAbort
        ? 'Request timed out after 25 seconds. Please try asking again.'
        : (err.message || 'Unable to connect to the server.');
      setErrorMessage(errMsg);
      const errMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Error: ${errMsg}`,
        isError: true,
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: "Hi! I'm the Academic Advisor chatbot of Vidyashilp University. How may I help you with your university-related questions?",
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setErrorMessage(null);
  };

  // Text-To-Speech
  const handleToggleSpeak = (msgId, text) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingMessageId(msgId);
  };

  // Speech-To-Text Recognition
  const handleToggleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className={`flex flex-col ${standalone ? 'h-screen max-w-4xl mx-auto shadow-xl border-x border-slate-200' : 'h-full w-full rounded-2xl shadow-sm border border-slate-200 overflow-hidden'} bg-white`}>
      {/* Header */}
      <header className="bg-vu-navy text-white px-5 py-3 flex items-center justify-between border-b border-vu-gold shadow-sm shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="bg-vu-gold text-vu-navy p-1.5 rounded-lg font-bold flex items-center justify-center shadow-inner">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">Vidyashilp University</h1>
            <p className="text-[11px] text-slate-300">Official AI Academic Advisor</p>
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center space-x-2.5 text-xs">
          <button
            onClick={checkHealth}
            title="Refresh connectivity status"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition"
          >
            {backendStatus === 'connected' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 hidden sm:inline">Online</span>
              </>
            )}
            {backendStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300">Offline</span>
              </>
            )}
            {backendStatus === 'checking' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span className="text-amber-200">Checking...</span>
              </>
            )}
          </button>
          <button
            onClick={handleClearChat}
            className="flex items-center space-x-1 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Controls Bar: Student Context & Mode Selector */}
      <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Student Profile Dropdown */}
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-vu-gold shrink-0" />
          <span className="font-semibold text-slate-600 hidden sm:inline">Student Profile:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-vu-gold focus:outline-none"
          >
            <option value="">Anonymous (Ask me first)</option>
            {students.map(s => {
              const scenarioText = s.scenario ? ` (${s.scenario.slice(0, 30)}...)` : (s.uen ? ` (${s.uen})` : '');
              return (
                <option key={s.id} value={s.id}>
                  {s.fullName || s.name}{scenarioText}
                </option>
              );
            })}
          </select>
          {selectedStudent && (
            <span className="text-[10px] text-slate-500 hidden md:inline">
              Sem {selectedStudent.currentSemester} | {selectedStudent.completedCredits} cr
            </span>
          )}
        </div>

        {/* Mode Toggle: Standard RAG vs Agentic Workflow */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-0.5 rounded-lg">
          <button
            onClick={() => setAdvisingMode('rag')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${advisingMode === 'rag' ? 'bg-white text-vu-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Standard RAG
          </button>
          <button
            onClick={() => setAdvisingMode('agentic')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${advisingMode === 'agentic' ? 'bg-vu-navy text-vu-gold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Cpu className="w-3 h-3" />
            <span>Agentic (5 Agents)</span>
          </button>
        </div>
      </div>

      {/* Connectivity error banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-700 flex items-center justify-between">
          <span>Connection status alert: {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs ${msg.sender === 'user'
                  ? 'bg-vu-blue text-white rounded-br-none'
                  : msg.isError
                    ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
            >
              {/* Message Header for Bot */}
              {msg.sender === 'bot' && !msg.isError && (
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100 text-[11px]">
                  <div className="flex items-center gap-1.5 text-vu-navy font-bold">
                    <Sparkles className="w-3 h-3 text-vu-gold" />
                    <span>Academic Advisor</span>
                    {msg.agentTrace && (
                      <span className="text-[9px] uppercase tracking-wider bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                        Agentic Pipeline
                      </span>
                    )}
                  </div>
                  {/* Text-To-Speech Button */}
                  <button
                    onClick={() => handleToggleSpeak(msg.id, msg.text)}
                    title={speakingMessageId === msg.id ? 'Stop listening' : 'Listen to response'}
                    className="p-1 text-slate-400 hover:text-vu-navy rounded transition"
                  >
                    {speakingMessageId === msg.id ? (
                      <VolumeX className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Text Body */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </div>

              {/* Multimodal Rendered Image Card (Grade Card / Course Breakdown) */}
              {msg.mediaAttachment && msg.mediaAttachment.imageUrl && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="bg-slate-900/5 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-vu-navy flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-vu-gold" />
                        {msg.mediaAttachment.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Download PNG Image */}
                        <a
                          href={msg.mediaAttachment.pngUrl || (msg.mediaAttachment.imageUrl.includes('?') ? `${msg.mediaAttachment.imageUrl.replace('/card-image', '/card-png')}&download=true` : `${msg.mediaAttachment.imageUrl.replace('/card-image', '/card-png')}?download=true`)}
                          download
                          className="text-[11px] font-semibold text-vu-navy hover:bg-slate-100 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-vu-gold" />
                          <span>Download Image</span>
                        </a>

                        {/* Download PDF */}
                        {msg.mediaAttachment.pdfUrl && (
                          <a
                            href={msg.mediaAttachment.pdfUrl}
                            download
                            className="text-[11px] font-semibold text-vu-navy hover:bg-slate-100 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-red-600" />
                            <span>Download PDF</span>
                          </a>
                        )}

                        <a
                          href={msg.mediaAttachment.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-vu-blue hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs"
                        >
                          <span>Open Full Image</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-xl bg-white border border-slate-200 shadow-xs">
                      <img
                        src={msg.mediaAttachment.imageUrl}
                        alt={msg.mediaAttachment.title}
                        className="w-full h-auto object-contain max-h-[500px]"
                        loading="lazy"
                      />
                    </div>
                    {msg.mediaAttachment.caption && (
                      <p className="text-[11px] text-slate-500 mt-2 italic px-1">
                        {msg.mediaAttachment.caption}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Interactive Follow-up Question Quick Chips (Phase 1) */}
              {msg.status === 'follow_up' && (
                <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quick Clarification Replies:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'I have passed Python, Calculus, and EDA',
                      'I have a backlog in Data Structures',
                      'Check with Student A profile',
                      'Check with Student B profile'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (chip.includes('Student A')) setSelectedStudentId('student_a');
                          else if (chip.includes('Student B')) setSelectedStudentId('student_b');
                          handleSendMessage(chip);
                        }}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Agent Trace Accordion (Phase 9) */}
              {msg.agentTrace && (
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)}
                    className="text-[11px] font-bold text-vu-blue hover:underline flex items-center gap-1"
                  >
                    <Bot className="w-3 h-3 text-vu-gold" />
                    <span>Inspect 5-Agent Execution Trace ({msg.metrics?.totalExecutionTimeMs || 0}ms)</span>
                    {expandedTraceId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedTraceId === msg.id && (
                    <div className="mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono">
                      {msg.agentTrace.map((st, i) => (
                        <div key={i} className="text-[11px] text-slate-700">
                          <span className="font-bold text-vu-navy">{st.step}. {st.agentName}</span> ({st.durationMs}ms):
                          <p className="text-slate-500 pl-3 font-sans text-[11px]">{st.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Source citations */}
              {msg.citations && msg.citations.length > 0 && (
                <SourceCitation
                  citations={msg.citations}
                  onSelectCitation={(cite) => setSelectedCitation(cite)}
                />
              )}

              <span
                className={`block text-[10px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-slate-300' : 'text-slate-400'
                  }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-vu-gold animate-pulse" />
                <span className="text-xs text-slate-600 font-medium">
                  {advisingMode === 'agentic'
                    ? 'Orchestrating 5-agent pipeline (Retrieval → Eligibility → Credits → Recommendation → Verification)...'
                    : 'Consulting official university regulations...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Form */}
      <footer className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-end space-x-2">
          <textarea
            rows="1"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask an academic advising question (e.g. 'Can I take Machine Learning next semester?')..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-vu-blue focus:border-transparent disabled:bg-slate-100 resize-none max-h-32"
          />

          {/* Voice Input Microphone Button */}
          <button
            type="button"
            onClick={handleToggleListen}
            title={isListening ? 'Stop listening' : 'Speak your question'}
            className={`p-2.5 rounded-xl border transition ${isListening ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-300'
              }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-vu-gold" />}
          </button>

          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="bg-vu-blue hover:bg-vu-navy text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-2">
          <span>Grounded in official Vidyashilp University documents</span>
          <span>•</span>
          <span>Phase 10 Privacy & Prompt-Injection Guard Enforced</span>
        </div>

        {/* Mandatory AI Safety & Academic Verification Disclaimer */}
        <p className="text-[10px] text-slate-400 text-center mt-2 px-2 leading-relaxed">
          AI-generated responses may contain errors or inaccuracies. Information related to sensitive academic records, grades, attendance, and other important student information should always be verified with the university's official records. Do not rely solely on AI-generated responses for critical decisions.
        </p>
      </footer>

      {/* Interactive PDF Page Viewer Modal */}
      {selectedCitation && selectedCitation.sourceType === 'pdf' && (
        <PdfViewerModal
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      )}

      {/* Interactive Excel Worksheet Viewer Modal */}
      {selectedCitation && selectedCitation.sourceType === 'excel' && (
        <ExcelViewerModal
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      )}
    </div>
  );
}
