"use client";

import { useTransition } from "react";
import { approveEnrollee, rejectEnrollee } from "@/app/dashboard/admin/actions";

interface PendingEnrollee {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export default function AdminPendingList({ requests }: { requests: PendingEnrollee[] }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      await approveEnrollee(id);
    });
  };

  const handleReject = (id: string) => {
    if (!confirm("Are you sure you want to reject and delete this application?")) return;
    startTransition(async () => {
      await rejectEnrollee(id);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Pending Enrollment Requests</h2>
        <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
          {requests.length} Waiting
        </span>
      </div>

      {requests.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">No pending student requests right now.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">
                    {req.first_name} {req.last_name}
                  </p>
                  <span className="text-xs text-slate-400">(@{req.username})</span>
                </div>
                <p className="text-xs text-slate-400">
                  Email: <span className="text-slate-200">{req.email}</span> | Phone:{" "}
                  <span className="text-slate-200">{req.phone_number}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  Approve Student
                </button>

                <button
                  onClick={() => handleReject(req.id)}
                  disabled={isPending}
                  className="bg-rose-950/80 border border-rose-800/60 hover:bg-rose-900 text-rose-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  Reject & Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}