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
  X,
  MessageSquare,
  Search,
  CheckSquare,
  RotateCcw,
} from "lucide-react";

interface TeacherProfile {
  full_name?: string;
  username?: string;
  role?: string;
}

interface StudentExamStatus {
  studentId: string;
  studentName: string;
  surname: string;
  first_name: string;
  username: string;
  courseId: string;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  isApproved: boolean;
}

interface ExamSubmissionRecord {
  id: string;
  userId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  score: number | null;
  percentage: number | null;
  passed: boolean;
  status: string;
  attemptNumber: number;
  retakeGranted: boolean;
  submittedAt: string;
}

interface EssaySubmission {
  id: string;
  userId: string;
  studentName: string;
  surname: string;
  first_name: string;
  username: string;
  courseId: string;
  lessonId: string | null;
  submissionText: string;
  questionTitle: string;
  score: number | null;
  feedback: string | null;
  status: string;
  submittedAt: string;
}

interface CertificateRecord {
  id: string;
  userId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  issuedAt: string | null;
}

interface StudentProfile {
  id: string;
  studentName: string;
  username: string;
  email: string;
}

export default function TeacherDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  // Navigation tab state: 'all' | 'students' | 'exams' | 'retakes' | 'essays' | 'certificates'
  const [activeTab, setActiveTab] = useState<string>("all");

  const [teacherProfile, setTeacherProfile] =
    useState<TeacherProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [studentCount, setStudentCount] = useState<number | string>("--");
  const [studentsList, setStudentsList] = useState<StudentProfile[]>([]);

  const [examStudentStatuses, setExamStudentStatuses] = useState<
    StudentExamStatus[]
  >([]);

  const [examSubmissions, setExamSubmissions] = useState<
    ExamSubmissionRecord[]
  >([]);

  const [essaySubmissions, setEssaySubmissions] = useState<EssaySubmission[]>(
    []
  );

  const [certificateRecords, setCertificateRecords] = useState<
    CertificateRecord[]
  >([]);

  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [selectedEssay, setSelectedEssay] =
    useState<EssaySubmission | null>(null);

  const [modalStatus, setModalStatus] = useState<string>("reviewed");
  const [modalScore, setModalScore] = useState<string>("");
  const [modalFeedback, setModalFeedback] = useState<string>("");
  const [isUpdatingEssay, setIsUpdatingEssay] = useState(false);
  const [isIssuingCert, setIsIssuingCert] = useState<string | null>(null);
  const [isGrantingRetake, setIsGrantingRetake] = useState<string | null>(null);

  /*
   * Helper function to format display names as Surname, First Name
   */
  const formatStudentName = (
    surname?: string | null,
    firstName?: string | null,
    fallbackName?: string | null
  ) => {
    if (surname && firstName) {
      return `${surname}, ${firstName}`;
    }
    return surname || firstName || fallbackName || "Student";
  };

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
         * Get student count
         */
        const { count: students } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student");

        setStudentCount(students ?? 0);

        /*
         * Fetch students ordered alphabetically by surname first
         */
        const { data: studentsData } = await supabase
          .from("profiles")
          .select("id, full_name, surname, first_name, username, email")
          .eq("role", "student")
          .order("surname", { ascending: true, nullsFirst: false });

        if (studentsData) {
          setStudentsList(
            studentsData.map((s) => ({
              id: s.id,
              studentName: formatStudentName(
                s.surname,
                s.first_name,
                s.full_name || s.email
              ),
              username: s.username || "student",
              email: s.email || "N/A",
            }))
          );
        }

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

        /*
         * Fetch Exam Submissions for grading & retakes
         */
        const { data: examSubData } = await supabase
          .from("student_exam_submissions")
          .select("*")
          .order("created_at", { ascending: false });

        /*
         * Fetch essay submissions
         */
        const { data: essaysData } = await supabase
          .from("user_essay_submissions")
          .select(
            "id, user_id, course_id, lesson_id, submission_text, essay_text, question_title, score, feedback, status, submitted_at"
          )
          .order("submitted_at", { ascending: false });

        /*
         * Fetch certificates if table exists
         */
        let certificatesData: any[] = [];
        try {
          const { data: certs } = await supabase
            .from("user_certificates")
            .select("id, user_id, course_id, issued_at");
          certificatesData = certs || [];
        } catch {
          // Table fallback
        }

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
                studentName: formatStudentName(
                  student.surname,
                  student.first_name,
                  student.full_name || student.email
                ),
                surname: student.surname || "",
                first_name: student.first_name || "",
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
         * Format Exam Submissions
         */
        if (examSubData && studentsData && coursesData) {
          const formattedSubmissions: ExamSubmissionRecord[] = examSubData.map((sub) => {
            const student = studentsData.find((s) => s.id === sub.user_id);
            const course = coursesData.find((c) => c.id === sub.course_id);

            return {
              id: sub.id,
              userId: sub.user_id,
              studentName: formatStudentName(
                student?.surname,
                student?.first_name,
                student?.full_name || student?.email
              ),
              courseId: sub.course_id,
              courseTitle: course?.title || "Exam Course",
              courseSlug: course?.slug || "foundational-discipleship",
              score: sub.score,
              percentage: sub.percentage,
              passed: sub.passed,
              status: sub.status || "graded",
              attemptNumber: sub.attempt_number || 1,
              retakeGranted: sub.retake_granted || false,
              submittedAt: sub.created_at
                ? new Date(sub.created_at).toLocaleDateString()
                : "N/A",
            };
          });

          setExamSubmissions(formattedSubmissions);
        }

        /*
         * Format essay submissions.
         */
        if (essaysData && studentsData) {
          const formattedEssays: EssaySubmission[] = essaysData.map(
            (essay) => {
              const student = studentsData.find(
                (s) => s.id === essay.user_id
              );

              return {
                id: essay.id,
                userId: essay.user_id,
                studentName: formatStudentName(
                  student?.surname,
                  student?.first_name,
                  student?.full_name || student?.email
                ),
                surname: student?.surname || "",
                first_name: student?.first_name || "",
                username: student?.username || "student",
                courseId: essay.course_id,
                lessonId: essay.lesson_id,
                submissionText:
                  essay.submission_text || essay.essay_text || "",
                questionTitle:
                  essay.question_title || "Practical Reflection / Essay",
                score: essay.score,
                feedback: essay.feedback,
                status: essay.status || "pending",
                submittedAt: essay.submitted_at
                  ? new Date(essay.submitted_at).toLocaleDateString()
                  : "N/A",
              };
            }
          );

          setEssaySubmissions(formattedEssays);
        }

        /*
         * Format certificates.
         */
        if (studentsData && coursesData) {
          const formattedCerts: CertificateRecord[] = [];
          studentsData.forEach((student) => {
            coursesData.forEach((course) => {
              const existingCert = certificatesData.find(
                (c) =>
                  c.user_id === student.id && c.course_id === course.id
              );
              formattedCerts.push({
                id: existingCert?.id || `${student.id}-${course.id}`,
                userId: student.id,
                studentName: formatStudentName(
                  student.surname,
                  student.first_name,
                  student.full_name || student.email
                ),
                courseId: course.id,
                courseTitle: course.title,
                issuedAt: existingCert?.issued_at
                  ? new Date(existingCert.issued_at).toLocaleDateString()
                  : null,
              });
            });
          });
          setCertificateRecords(formattedCerts);
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

      const { error } = await supabase.from("exam_approvals").upsert(
        {
          user_id: studentId,
          course_id: courseId,
          is_approved: newStatus,
          approved_by: user.id,
          approved_at: newStatus ? new Date().toISOString() : null,
        },
        {
          onConflict: "user_id,course_id",
        }
      );

      if (error) throw error;

      setExamStudentStatuses((previous) =>
        previous.map((item) =>
          item.studentId === studentId && item.courseId === courseId
            ? {
                ...item,
                isApproved: newStatus,
              }
            : item
        )
      );

      const statusText = newStatus ? "granted" : "revoked";
      setActionSuccess(`Exam approval ${statusText} successfully.`);

      router.refresh();
    } catch (error: any) {
      setActionError(
        error.message || "Failed to update exam approval."
      );
    }
  };

  /*
   * Teacher approves Exam Retake
   */
  const handleApproveRetake = async (submissionId: string) => {
    setIsGrantingRetake(submissionId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const { error } = await supabase
        .from("student_exam_submissions")
        .update({ retake_granted: true })
        .eq("id", submissionId);

      if (error) throw error;

      setExamSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submissionId ? { ...sub, retakeGranted: true } : sub
        )
      );

      setActionSuccess("Exam retake successfully granted to the student.");
    } catch (error: any) {
      console.error("Error approving retake:", error);
      setActionError(error.message || "Failed to approve exam retake.");
    } finally {
      setIsGrantingRetake(null);
    }
  };

  /*
   * Handle Certificate Issuance Action
   */
  const handleIssueCertificate = async (
    userId: string,
    courseId: string,
    recordId: string,
    courseTitle?: string
  ) => {
    if (!userId || !courseId) {
      setActionError("Cannot issue certificate: Missing user or course identifier.");
      return;
    }

    setIsIssuingCert(recordId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("user_certificates")
        .upsert(
          [
            {
              user_id: userId,
              course_id: courseId,
              course_name: courseTitle || "Course Certificate",
              issued_at: now,
            },
          ],
          { onConflict: "user_id,course_id" }
        )
        .select();

      if (error) throw error;

      const formattedToday = new Date(now).toLocaleDateString();

      setCertificateRecords((prev) =>
        prev.map((cert) =>
          cert.id === recordId || (cert.userId === userId && cert.courseId === courseId)
            ? { ...cert, issuedAt: formattedToday }
            : cert
        )
      );

      setActionSuccess(`Certificate issued successfully${courseTitle ? ` for ${courseTitle}` : ""}.`);
    } catch (error: any) {
      console.error("Error issuing certificate:", error);
      setActionError(error.message || "Failed to issue certificate.");
    } finally {
      setIsIssuingCert(null);
    }
  };

  /*
   * Open essay grading modal.
   */
  const openEssayModal = (essay: EssaySubmission) => {
    setSelectedEssay(essay);
    setModalStatus(essay.status || "reviewed");
    setModalScore(essay.score !== null ? essay.score.toString() : "");
    setModalFeedback(essay.feedback || "");
  };

  /*
   * Save essay grading, feedback, and status.
   */
  const handleUpdateEssay = async () => {
    if (!selectedEssay) return;

    setIsUpdatingEssay(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      const parsedScore =
        modalScore.trim() !== "" ? parseFloat(modalScore) : null;

      const { error: updateError } = await supabase
        .from("user_essay_submissions")
        .update({
          status: modalStatus,
          score: parsedScore,
          feedback: modalFeedback,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedEssay.id);

      if (updateError) {
        throw updateError;
      }

      setEssaySubmissions((previous) =>
        previous.map((item) =>
          item.id === selectedEssay.id
            ? {
                ...item,
                status: modalStatus,
                score: parsedScore,
                feedback: modalFeedback,
              }
            : item
        )
      );

      setActionSuccess(
        `Successfully reviewed essay for ${selectedEssay.studentName}.`
      );

      setSelectedEssay(null);
      router.refresh();
    } catch (error: any) {
      setActionError(
        error.message || "Failed to update essay review."
      );
    } finally {
      setIsUpdatingEssay(false);
    }
  };

  /*
   * Filtered lists based on search query
   */
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return studentsList;
    const query = studentSearchQuery.toLowerCase();
    return studentsList.filter(
      (s) =>
        s.studentName.toLowerCase().includes(query) ||
        s.username.toLowerCase().includes(query)
    );
  }, [studentsList, studentSearchQuery]);

  const filteredExamStatuses = useMemo(() => {
    let list = examStudentStatuses;
    if (activeTab === "exams") {
      list = list.filter((s) => !s.isApproved);
    }
    if (!studentSearchQuery.trim()) return list;
    const query = studentSearchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.studentName.toLowerCase().includes(query) ||
        s.username.toLowerCase().includes(query) ||
        s.courseTitle.toLowerCase().includes(query)
    );
  }, [examStudentStatuses, studentSearchQuery, activeTab]);

  const filteredExamSubmissions = useMemo(() => {
    let list = examSubmissions;
    if (activeTab === "retakes") {
      list = list.filter((e) => !e.passed);
    }
    if (!studentSearchQuery.trim()) return list;
    const query = studentSearchQuery.toLowerCase();
    return list.filter(
      (e) =>
        e.studentName.toLowerCase().includes(query) ||
        e.courseTitle.toLowerCase().includes(query)
    );
  }, [examSubmissions, studentSearchQuery, activeTab]);

  const filteredEssaySubmissions = useMemo(() => {
    let list = essaySubmissions;
    if (activeTab === "essays") {
      list = list.filter((e) => e.status === "pending");
    }
    if (!studentSearchQuery.trim()) return list;
    const query = studentSearchQuery.toLowerCase();
    return list.filter(
      (e) =>
        e.studentName.toLowerCase().includes(query) ||
        e.username.toLowerCase().includes(query) ||
        e.questionTitle.toLowerCase().includes(query)
    );
  }, [essaySubmissions, studentSearchQuery, activeTab]);

  const filteredCertificates = useMemo(() => {
    if (!studentSearchQuery.trim()) return certificateRecords;
    const query = studentSearchQuery.toLowerCase();
    return certificateRecords.filter(
      (c) =>
        c.studentName.toLowerCase().includes(query) ||
        c.courseTitle.toLowerCase().includes(query)
    );
  }, [certificateRecords, studentSearchQuery]);

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
                Teaching, exam approval, retake authorization, student assessment, and certificates
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => router.push("/dashboard/admin")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Admin
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
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

          {/* Interactive Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mt-8">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "students" ? "all" : "students")}
              className={`text-left p-5 rounded-2xl border transition ${
                activeTab === "students"
                  ? "bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/40"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                Active Students
              </p>
              <p className="text-3xl font-black text-white mt-1">
                {studentCount}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "retakes" ? "all" : "retakes")}
              className={`text-left p-5 rounded-2xl border transition ${
                activeTab === "retakes"
                  ? "bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/40"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                Exam Retake Requests
              </p>
              <p className="text-3xl font-black text-purple-400 mt-1">
                {examSubmissions.filter((s) => !s.passed && !s.retakeGranted).length}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "essays" ? "all" : "essays")}
              className={`text-left p-5 rounded-2xl border transition ${
                activeTab === "essays"
                  ? "bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                Pending Essays
              </p>
              <p className="text-3xl font-black text-amber-400 mt-1">
                {
                  essaySubmissions.filter(
                    (e) => e.status === "pending"
                  ).length
                }
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "exams" ? "all" : "exams")}
              className={`text-left p-5 rounded-2xl border transition ${
                activeTab === "exams"
                  ? "bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/40"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                Pending Initial Access
              </p>
              <p className="text-3xl font-black text-emerald-400 mt-1">
                {
                  examStudentStatuses.filter((student) => !student.isApproved)
                    .length
                }
              </p>
            </button>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex border-b border-slate-800 mt-8 gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "all"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              View All Sections
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "students"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              1. Student List
            </button>
            <button
              onClick={() => setActiveTab("exams")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "exams"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              2. Initial Exam Access
            </button>
            <button
              onClick={() => setActiveTab("retakes")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "retakes"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              3. Exam Retake Approvals
            </button>
            <button
              onClick={() => setActiveTab("essays")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "essays"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              4. Essay Review
            </button>
            <button
              onClick={() => setActiveTab("certificates")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "certificates"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              5. Certificate Issuance
            </button>
          </div>

          {/* Global Student Search Bar Filter */}
          <div className="mt-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 ml-1" />
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder="Search students by name (Surname, First Name) or username across all lists..."
              className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            {studentSearchQuery && (
              <button
                onClick={() => setStudentSearchQuery("")}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>

          {/* SECTION 1: Active Student List View */}
          {(activeTab === "all" || activeTab === "students") && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">
                  1. Active Student List
                </h2>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400">No active students found.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredStudents.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{s.studentName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          @{s.username} • {s.email}
                        </p>
                      </div>
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
                        Active Student
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: Initial Exam Approvals Card */}
          {(activeTab === "all" || activeTab === "exams") && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">
                    2. Initial Exam Approvals
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                  Lesson Completion Gate
                </span>
              </div>

              {filteredExamStatuses.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400">
                    No matching student lesson progress data found.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredExamStatuses.map((student) => {
                    const isFullyComplete =
                      student.completedLessons === student.totalLessons &&
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
                            <span className="text-slate-400">Progress:</span>{" "}
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
          )}

          {/* SECTION 3: Exam Retake Approvals */}
          {(activeTab === "all" || activeTab === "retakes") && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-white">
                    3. Exam Retake Approvals
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                  Permission Gate
                </span>
              </div>

              {filteredExamSubmissions.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400">
                    No student exam submissions recorded yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredExamSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">
                            {sub.studentName}
                          </p>
                          <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded">
                            Attempt #{sub.attemptNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Course:{" "}
                          <span className="text-slate-200 font-medium">
                            {sub.courseTitle}
                          </span>{" "}
                          • Submitted: {sub.submittedAt}
                        </p>
                        <p className="text-xs mt-1">
                          Score:{" "}
                          <span className="font-bold text-white">
                            {sub.score ?? 0} pts ({sub.percentage ?? 0}%)
                          </span>{" "}
                          —{" "}
                          {sub.passed ? (
                            <span className="text-emerald-400 font-bold">Passed</span>
                          ) : (
                            <span className="text-rose-400 font-bold">Failed / Needs Retake</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {sub.passed ? (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Passed
                          </span>
                        ) : sub.retakeGranted ? (
                          <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4" /> Retake Granted
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApproveRetake(sub.id)}
                            disabled={isGrantingRetake === sub.id}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                            {isGrantingRetake === sub.id
                              ? "Granting..."
                              : "Approve Retake"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: Student Essay & Answer Review Card */}
          {(activeTab === "all" || activeTab === "essays") && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mt-8">
              <div className="flex items-center gap-2 mb-4">
                <BookOpenCheck className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">
                  4. Essay Review
                </h2>
              </div>

              {filteredEssaySubmissions.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400">
                    No matching essay submissions recorded yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredEssaySubmissions.map((essay) => (
                    <div
                      key={essay.id}
                      className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          {essay.studentName}
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5 font-medium">
                          {essay.questionTitle}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Submitted: {essay.submittedAt}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          {essay.status === "pending" && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                              Pending Review
                            </span>
                          )}
                          {essay.status === "reviewed" && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md">
                              Reviewed
                            </span>
                          )}
                          {essay.status === "rejected" && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 border border-rose-400/20 px-2 py-0.5 rounded-md">
                              Rejected / Needs Revision
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-black text-white">
                            {essay.score !== null
                              ? `${essay.score} pts`
                              : "Unscored"}
                          </p>
                        </div>

                        <button
                          onClick={() => openEssayModal(essay)}
                          className="px-3 py-2 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-600/30 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Read & Grade Essay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: Student Certificate Issuance Card */}
          {(activeTab === "all" || activeTab === "certificates") && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">
                    5. Student Certificate Issuance
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                  Completion Credentials
                </span>
              </div>

              {filteredCertificates.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400">
                    No matching certificate records found.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredCertificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          {cert.studentName}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Course:{" "}
                          <span className="text-slate-200 font-medium">
                            {cert.courseTitle}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {cert.issuedAt ? (
                          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Issued on {cert.issuedAt}
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              handleIssueCertificate(
                                cert.userId,
                                cert.courseId,
                                cert.id,
                                cert.courseTitle
                              )
                            }
                            disabled={isIssuingCert === cert.id}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                          >
                            <Award className="w-4 h-4" />
                            {isIssuingCert === cert.id
                              ? "Issuing..."
                              : "Issue Certificate"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                  <div key={`empty-${index}`} className="p-2.5" />
                ))}

                {Array.from({
                  length: daysInMonth,
                }).map((_, index) => {
                  const day = index + 1;

                  const isToday =
                    day === new Date().getDate() &&
                    currentMonth.getMonth() === new Date().getMonth() &&
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

      {/* Essay Reading & Grading Modal */}
      {selectedEssay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedEssay(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">
                Review Student Essay
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Student:{" "}
                <span className="text-blue-400 font-semibold">
                  {selectedEssay.studentName}
                </span>{" "}
                • Prompt:{" "}
                <span className="text-slate-200">
                  {selectedEssay.questionTitle}
                </span>
              </p>
            </div>

            {/* Student's Essay Text Pane */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Student's Answer / Submission
              </label>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl max-h-60 overflow-y-auto text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedEssay.submissionText ||
                  "No submission text provided."}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Review Status
                </label>

                <select
                  value={modalStatus}
                  onChange={(event) => setModalStatus(event.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs"
                >
                  <option value="reviewed">Reviewed / Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">
                    Rejected / Needs Revision
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Score (Numeric)
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={modalScore}
                  onChange={(e) => setModalScore(e.target.value)}
                  placeholder="e.g. 95.00"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Teacher Feedback
              </label>

              <textarea
                rows={3}
                value={modalFeedback}
                onChange={(e) => setModalFeedback(e.target.value)}
                placeholder="Type your notes or feedback for the student here..."
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEssay(null)}
                className="w-1/2 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateEssay}
                disabled={isUpdatingEssay}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {isUpdatingEssay ? "Saving..." : "Save Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}