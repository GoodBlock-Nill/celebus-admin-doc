"use client";

import { useParams } from "next/navigation";
import { LangProvider } from "@/components/LangProvider";
import Header from "@/components/Header";
import PostDetail from "@/components/PostDetail";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <LangProvider>
      <Header />
      <PostDetail id={id} />
    </LangProvider>
  );
}
