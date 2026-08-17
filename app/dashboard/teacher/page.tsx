```tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  GraduationCap,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Award,
  FileCheck,
  ShieldAlert,
  ArrowLeft,
  BookOpenCheck,
  XCircle,
  Edit3,
  RotateCcw,
  X,
} from "lucide-react";

interface TeacherProfile {
  full_name?: string;
  username?: string;
  role?: string;
}

interface StudentExamStatus {
  studentId: string;
  studentName: string;
  username: string;
  courseId: string;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  isApproved: boolean;
}

interface ExamSubmission {
  id: string;
  userId: string;
  studentName: string;
  username: string;
  courseId: string;
  courseSlug: string;
  score: number;
  percentage: number;
  passed: boolean;
  status: string;
  submittedAt: string;
}

export default function TeacherDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [teacherProfile, setTeacherProfile] =
    useState<TeacherProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [studentCount, setStudentCount] = useState<number | string>("--");

  const [examStudentStatuses, setExamStudentStatuses] = useState<
    StudentExamStatus[]
  >([]);

  const [examSubmissions, setExamSubmissions] = useState<ExamSubmission[]>(
    []
  );

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [selectedSubmission, setSelectedSubmission] =
    useState<ExamSubmission | null>(null);

  const [modalStatus, setModalStatus] = useState<string>("graded");
  const [modalPassed, setModalPassed] = useState<boolean>(true);
  const [isUpdatingGrade, setIsUpdatingGrade] = useState(false);

  /*
   * Clock
   */
  useEffect(() => {
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /*
   * Load Teacher Dashboard
   */
  useEffect(() => {
    async function loadTeacherData() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setLoading(false);
          return;
        }

        /*
         * Get current user's profile.
         */
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username, role")
          .eq("id", user.id)
          .maybeSingle();

        const currentProfile: TeacherProfile = {
          full_name:
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.email ||
            "User",
          username:
            profile?.username ||
            user.user_metadata?.username ||
            "user",
          role:
            profile?.role ||
            user.user_metadata?.role ||
            "teacher",
        };

        setTeacherProfile(currentProfile);

        /*
         * IMPORTANT:
         * Only profiles already designated as students are loaded.
         *
         * There is NO enrollment approval functionality here.
         */
        const { count: students } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student");

        setStudentCount(students ?? 0);

        const { data: studentsData } = await supabase
          .from("profiles")
          .select("id, full_name, username, email")
          .eq("role", "student");

        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title, slug");

        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id, course_id");

        const { data: progressData } = await supabase
          .from("user_lesson_progress")
          .select("user_id, lesson_id")
          .eq("completed", true);

        const { data: approvalsData } = await supabase
          .from("exam_approvals")
          .select("user_id, course_id, is_approved");

        const { data: submissionsData } = await supabase
          .from("student_exam_submissions")
          .select(
            "id, user_id, course_id, score, percentage, passed, status, submitted_at"
          )
          .order("submitted_at", { ascending: false });

        /*
         * Build student progress / exam approval data.
         */
        if (studentsData && coursesData) {
          const statuses: StudentExamStatus[] = [];

          studentsData.forEach((student) => {
            coursesData.forEach((course) => {
              const courseLessons =
                lessonsData?.filter(
                  (lesson) => lesson.course_id === course.id
                ) || [];

              const totalLessons = courseLessons.length;

              if (totalLessons === 0) return;

              const lessonIds = new Set(
                courseLessons.map((lesson) => lesson.id)
              );

              const userCompletedCount =
                progressData?.filter(
                  (progress) =>
                    progress.user_id === student.id &&
                    lessonIds.has(progress.lesson_id)
                ).length || 0;

              const approval = approvalsData?.find(
                (item) =>
                  item.user_id === student.id &&
                  item.course_id === course.id
              );

              statuses.push({
                studentId: student.id,
                studentName:
                  student.full_name || student.email || "Student",
                username: student.username || "student",
                courseId: course.id,
                courseTitle: course.title,
                completedLessons: userCompletedCount,
                totalLessons,
                isApproved: approval?.is_approved ?? false,
              });
            });
          });

          setExamStudentStatuses(statuses);
        }

        /*
         * Format exam submissions.
         */
        if (submissionsData && studentsData) {
          const formattedSubmissions: ExamSubmission[] =
            submissionsData.map((submission) => {
              const student = studentsData.find(
                (student) => student.id === submission.user_id
              );

              const courseSlug =
                coursesData?.find(
                  (course) => course.id === submission.course_id
                )?.slug || submission.course_id;

              return {
                id: submission.id,
                userId: submission.user_id,
                studentName:
                  student?.full_name ||
                  student?.email ||
                  "Unknown Student",
                username: student?.username || "student",
                courseSlug,
                courseId: submission.course_id,
                score: submission.score || 0,
                percentage: submission.percentage || 0,
                passed: submission.passed || false,
                status: submission.status || "graded",
                submittedAt: submission.submitted_at
                  ? new Date(
                      submission.submitted_at
                    ).toLocaleDateString()
                  : "N/A",
              };
            });

          setExamSubmissions(formattedSubmissions);
        }
      } catch (error) {
        console.error(
          "Unexpected error loading teacher dashboard:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeacherData();
  }, [supabase]);

  /*
   * Sign out
   */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login/staff";
  };

  /*
   * Teacher can approve/revoke EXAM access.
   *
   * This is intentionally different from approving a new student.
   */
  const handleToggleExamApproval = async (
    studentId: string,
    courseId: string,
    currentStatus: boolean
  ) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      const newStatus = !currentStatus;

      const { error } = await supabase
        .from("exam_approvals")
        .upsert(
          {
            user_id: studentId,
            course_id: courseId,
            is_approved: newStatus,
            approved_by: user.id,
            approved_at: newStatus
              ? new Date().toISOString()
              : null,
          },
          {
            onConflict: "user_id,course_id",
          }
        );

      if (error) throw error;

      setExamStudentStatuses((previous) =>
        previous.map((item) =>
          item.studentId === studentId &&
          item.courseId === courseId
            ? {
                ...item,
                isApproved: newStatus,
              }
            : item
        )
      );

      setActionSuccess(
        `Exam approval ${
          newStatus ? "granted" : "revoked"
        } successfully.`
      );

      router.refresh();
    } catch (error: any) {
      setActionError(
        error.message || "Failed to update exam approval."
      );
    }
  };

  /*
   * Open grading modal.
   */
  const openGradingModal = (submission: ExamSubmission) => {
    setSelectedSubmission(submission);
    setModalStatus(submission.status);
    setModalPassed(submission.passed);
  };

  /*
   * Save grading/status.
   */
  const handleUpdateGradeStatus = async () => {
    if (!selectedSubmission) return;

    setIsUpdatingGrade(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      /*
       * Update exam submission.
       */
      const { error: submissionError } = await supabase
        .from("student_exam_submissions")
        .update({
          status: modalStatus,
          passed: modalPassed,
        })
        .eq("id", selectedSubmission.id);

      if (submissionError) {
        throw submissionError;
      }

      /*
       * If passed, record completion/approval.
       */
      if (modalPassed) {
        const { error: approvalError } = await supabase
          .from("exam_approvals")
          .upsert(
            {
              user_id: selectedSubmission.userId,
              course_id: selectedSubmission.courseId,
              is_approved: true,
              approved_by: user.id,
              approved_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,course_id",
            }
          );

        if (approvalError) {
          throw approvalError;
        }
      }

      setExamSubmissions((previous) =>
        previous.map((submission) =>
          submission.id === selectedSubmission.id
            ? {
                ...submission,
                status: modalStatus,
                passed: modalPassed,
              }
            : submission
        )
      );

      setActionSuccess(
        `Successfully updated ${selectedSubmission.studentName}.`
      );

      setSelectedSubmission(null);
      router.refresh();
    } catch (error: any) {
      setActionError(
        error.message || "Failed to update exam status."
      );
    } finally {
      setIsUpdatingGrade(false);
    }
  };

  /*
   * Calendar helpers.
   */
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayIndex = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
  });

  const year = currentMonth.getFullYear();

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          <span className="text-slate-400 text-sm">
            Loading Teacher Dashboard...
          </span>
        </div>
      </div>
    );
  }

  const isAdmin = teacherProfile?.role === "admin";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-10">

      {/* Admin banner */}
      {isAdmin && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-amber-400 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Admin Mode: Viewing Teacher Dashboard</span>
          </div>

          <button
            onClick={() => router.push("/dashboard/admin")}
            className="hover:underline flex items-center gap-1 text-amber-300"
          >
            Return to Admin Control Center
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">

            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                <GraduationCap className="w-3.5 h-3.5" />
                Teacher Portal
              </div>

              <h1 className="text-3xl font-extrabold text-white">
                {isAdmin
                  ? "Teacher Dashboard (Admin View)"
                  : "Teacher Dashboard"}
              </h1>

              <p className="text-slate-400 text-sm mt-1">
                Welcome back{" "}
                <span className="text-blue-400 font-semibold">
                  {teacherProfile?.full_name}
                </span>
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Teaching, exam approval, and student assessment
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() =>
                    router.push("/dashboard/admin")
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Admin
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="mt-8 space-y-3">
            {actionError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5" />
                {actionError}
              </div>
            )}

            {actionSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5" />
                {actionSuccess}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Active Students
              </p>

              <p className="text-3xl font-black text-white mt-1">
                {studentCount}
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Approved for Exams
              </p>

              <p className="text-3xl font-black text-emerald-400 mt-1">
                {
                  examStudentStatuses.filter(
                    (student) => student.isApproved
                  ).length
                }
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Exams Submitted
              </p>

              <p className="text-3xl font-black text-amber-400 mt-1">
                {examSubmissions.length}
              </p>
            </div>
          </div>

          {/* Teacher Responsibility Notice */}
          <div className="mt-8 p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-blue-400 mt-0.5" />

              <div>
                <p className="text-sm font-bold text-white">
                  Teacher Responsibilities
                </p>

                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Teachers manage student progress, exam eligibility,
                  examinations, and grading. Student enrollment and
                  course access are managed by the Administrator.
                </p>
              </div>
            </div>
          </div>

          {/* Exam Submissions */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mt-8">

            <div className="flex items-center gap-2 mb-4">
              <BookOpenCheck className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">
                Submitted Student Exams & Grading
              </h2>
            </div>

            {examSubmissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400">
                  No exam submissions recorded yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {examSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">
                        {submission.studentName}
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Course:{" "}
                        <span className="text-slate-200 font-medium uppercase">
                          {submission.courseSlug}
                        </span>
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        {submission.status ===
                          "pending_essay_review" && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                            Essay Review Pending
                          </span>
                        )}

                        {submission.status ===
                          "retake_required" && (
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded-md">
                            Retake Required
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-black text-white">
                          {submission.percentage}%
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {submission.score} Points
                        </p>
                      </div>

                      {submission.passed ? (
                        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          PASSED
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" />
                          NOT PASSED
                        </div>
                      )}

                      <button
                        onClick={() =>
                          openGradingModal(submission)
                        }
                        className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Grade / Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exam Approval */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mt-8">

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />

                <h2 className="text-lg font-bold text-white">
                  Student Exam Approvals
                </h2>
              </div>

              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                Lesson Completion Gate
              </span>
            </div>

            {examStudentStatuses.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400">
                  No student lesson progress data found.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {examStudentStatuses.map((student) => {
                  const isFullyComplete =
                    student.completedLessons ===
                      student.totalLessons &&
                    student.totalLessons > 0;

                  return (
                    <div
                      key={`${student.studentId}-${student.courseId}`}
                      className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          {student.studentName}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Course:{" "}
                          <span className="text-slate-200 font-medium">
                            {student.courseTitle}
                          </span>
                        </p>

                        <p className="text-xs mt-2">
                          <span className="text-slate-400">
                            Progress:
                          </span>{" "}
                          <span
                            className={
                              isFullyComplete
                                ? "text-emerald-400 font-bold"
                                : "text-amber-400 font-semibold"
                            }
                          >
                            {student.completedLessons} /{" "}
                            {student.totalLessons} lessons completed
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">

                        {!isFullyComplete ? (
                          <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                            Complete all lessons first
                          </span>
                        ) : student.isApproved ? (
                          <button
                            onClick={() =>
                              handleToggleExamApproval(
                                student.studentId,
                                student.courseId,
                                true
                              )
                            }
                            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approved — Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleToggleExamApproval(
                                student.studentId,
                                student.courseId,
                                false
                              )
                            }
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
                          >
                            <Award className="w-4 h-4" />
                            Approve Exam Access
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mt-8">

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-400" />

                <h2 className="text-lg font-bold text-white">
                  Teacher Class Schedule & Calendar
                </h2>
              </div>

              {currentTime && (
                <span className="text-xs text-slate-400">
                  {currentTime.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">
                  {monthName} {year}
                </h3>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 py-1">
                <span>SUN</span>
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                {Array.from({
                  length: firstDayIndex,
                }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="p-2.5"
                  />
                ))}

                {Array.from({
                  length: daysInMonth,
                }).map((_, index) => {
                  const day = index + 1;

                  const isToday =
                    day === new Date().getDate() &&
                    currentMonth.getMonth() ===
                      new Date().getMonth() &&
                    currentMonth.getFullYear() ===
                      new Date().getFullYear();

                  const isSelected =
                    day === selectedDate.getDate() &&
                    currentMonth.getMonth() ===
                      selectedDate.getMonth() &&
                    currentMonth.getFullYear() ===
                      selectedDate.getFullYear();

                  return (
                    <button
                      key={day}
                      onClick={() =>
                        setSelectedDate(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth(),
                            day
                          )
                        )
                      }
                      className={`p-2.5 rounded-xl text-xs ${
                        isSelected
                          ? "bg-amber-400 text-slate-950 font-bold"
                          : isToday
                          ? "bg-blue-600/30 border border-blue-500 text-blue-300 font-bold"
                          : "bg-slate-900/50 hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl relative">

            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">
                Review & Grade Exam
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Student:{" "}
                <span className="text-blue-400 font-semibold">
                  {selectedSubmission.studentName}
                </span>
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">
                  Auto-Calculated Score
                </p>

                <p className="text-2xl font-black text-white">
                  {selectedSubmission.percentage}%
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400">
                  Total Points
                </p>

                <p className="text-lg font-bold text-slate-300">
                  {selectedSubmission.score}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Submission Status
              </label>

              <select
                value={modalStatus}
                onChange={(event) =>
                  setModalStatus(event.target.value)
                }
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs"
              >
                <option value="graded">
                  Graded / Finalized
                </option>

                <option value="pending_essay_review">
                  Pending Essay Review
                </option>

                <option value="retake_required">
                  Retake Required
                </option>

                <option value="failed">
                  Failed
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Pass Requirement
              </label>

              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() => setModalPassed(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold ${
                    modalPassed
                      ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400"
                      : "bg-slate-950 border border-slate-800 text-slate-400"
                  }`}
                >
                  Passed
                </button>

                <button
                  type="button"
                  onClick={() => setModalPassed(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold ${
                    !modalPassed
                      ? "bg-rose-500/20 border border-rose-500 text-rose-400"
                      : "bg-slate-950 border border-slate-800 text-slate-400"
                  }`}
                >
                  Not Passed
                </button>

              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">

              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="w-1/2 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateGradeStatus}
                disabled={isUpdatingGrade}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {isUpdatingGrade
                  ? "Saving..."
                  : "Save Grade"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```
