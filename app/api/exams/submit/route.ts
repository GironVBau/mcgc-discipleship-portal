import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // 1. Verify Authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  // 2. Verify Role Authorization
  const role = user.user_metadata?.role;

  if (role !== "student") {
    return NextResponse.json(
      { error: "Forbidden: Only students can submit exams" },
      { status: 403 }
    );
  }

  try {
    // 3. Process Payload
    const body = await request.json();
    const { courseSlug = "foundational-discipleship", answers = {} } = body;

    // 4. Fetch Answer Key for the Course
    const { data: questions, error: qError } = await supabase
      .from("exam_questions")
      .select("question_number, correct_answer, points, part_number")
      .eq("course_slug", courseSlug);

    if (qError) {
      console.error("Error fetching exam questions:", qError);
      return NextResponse.json(
        { error: "Failed to fetch exam questions for grading" },
        { status: 500 }
      );
    }

    let totalScore = 0;
    let totalPossiblePoints = 0;

    if (questions) {
      questions.forEach((q) => {
        // Objective questions (having correct_answer)
        if (q.correct_answer !== null) {
          const points = q.points ?? 1;
          totalPossiblePoints += points;

          const studentAns = answers[String(q.question_number)]?.trim().toLowerCase();
          const correctAns = q.correct_answer.trim().toLowerCase();

          if (studentAns && studentAns === correctAns) {
            totalScore += points;
          }
        }
      });
    }

    const percentage =
      totalPossiblePoints > 0
        ? Math.round((totalScore / totalPossiblePoints) * 100)
        : 0;

    const passed = percentage >= 85;
    const essayText = answers["essay"] || answers["6"] || "";

    // 5. Insert Exam Submission Record
    const { data: examSub, error: subError } = await supabase
      .from("student_exam_submissions")
      .insert({
        user_id: user.id,
        course_slug: courseSlug,
        answers: answers,
        score: totalScore,
        percentage: percentage,
        passed: passed,
        status: essayText ? "pending_essay_review" : "graded",
      })
      .select("id")
      .single();

    if (subError) {
      console.error("Database submission error:", subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    // 6. Queue Essay Submission for Instructor Review if Present
    if (essayText) {
      const { error: essayError } = await supabase.from("user_essay_submissions").insert({
        student_id: user.id,
        user_id: user.id,
        question_title: "Practical Reflection / Essay",
        essay_text: essayText,
        exam_result_id: examSub?.id || null,
        status: "pending",
        submitted_at: new Date().toISOString(),
      });

      if (essayError) {
        console.error("Essay queue insertion error:", essayError);
      }
    }

    return NextResponse.json({
      success: true,
      score: totalScore,
      percentage,
      passed,
      message: "Exam submitted successfully",
    });
  } catch (err: any) {
    console.error("Fatal API route error:", err);
    return NextResponse.json(
      { error: err?.message || "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}