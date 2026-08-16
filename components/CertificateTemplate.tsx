import React from "react";
import { Award, CheckCircle2 } from "lucide-react";

interface CertificateProps {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  credentialId: string;
}

export default function CertificateTemplate({
  studentName,
  courseTitle,
  issueDate,
  credentialId,
}: CertificateProps) {
  return (
    <div id="certificate-container" className="w-[1050px] h-[745px] bg-slate-950 text-slate-100 p-12 relative flex flex-col justify-between border-8 border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden font-sans mx-auto">
      {/* Background Decorative Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-3 z-10">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 mb-2">
          <Award className="w-10 h-10" />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400 font-bold">
          Certificate of Completion
        </p>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          MCGC Discipleship Pathway
        </h1>
      </div>

      {/* Body / Recipient Info */}
      <div className="text-center space-y-6 z-10 my-auto">
        <p className="text-sm uppercase tracking-wider text-slate-400 font-medium">
          This is proudly presented to
        </p>
        
        <div className="inline-block border-b-2 border-amber-500/50 pb-2 px-12">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-amber-200">
            {studentName}
          </h2>
        </div>

        <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
          For successfully completing all course requirements, lessons, and passing the comprehensive examination for the level:
        </p>

        <h3 className="text-2xl font-bold text-amber-400 tracking-wide uppercase">
          {courseTitle}
        </h3>
      </div>

      {/* Footer / Signatures & Metadata */}
      <div className="flex items-end justify-between border-t border-slate-800/80 pt-6 z-10 text-xs text-slate-400">
        <div className="space-y-1">
          <p className="font-semibold text-slate-300">Credential ID</p>
          <p className="font-mono text-slate-500">{credentialId}</p>
        </div>

        <div className="text-center space-y-1">
          <div className="w-48 border-b border-slate-700 pb-2 mb-1">
            <p className="font-serif italic text-amber-200 text-sm">MCGC Leadership</p>
          </div>
          <p className="uppercase tracking-wider text-[10px] text-slate-500">Authorized Signature</p>
        </div>

        <div className="space-y-1 text-right">
          <p className="font-semibold text-slate-300">Date Issued</p>
          <p className="text-slate-500">{issueDate}</p>
        </div>
      </div>
    </div>
  );
}