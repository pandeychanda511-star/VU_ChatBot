import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Chatbot from '../components/Chatbot';

export default function ChatbotPage() {
  return (
    <DashboardLayout title="Academic Chatbot">
      {/* Container embedding the protected Chatbot component */}
      <div className="w-full h-[calc(100vh-140px)] min-h-[580px] bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <Chatbot standalone={false} />
      </div>
    </DashboardLayout>
  );
}

