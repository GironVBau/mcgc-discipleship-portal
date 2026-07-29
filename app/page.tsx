"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  useEffect(() => {
    async function test() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);
    }

    test();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">
        Welcome to the MCGC Discipleship Portal
      </h1>
    </main>
  );
}