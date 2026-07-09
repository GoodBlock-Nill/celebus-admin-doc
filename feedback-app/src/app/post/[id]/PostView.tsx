"use client";

import { LangProvider } from "@/components/LangProvider";
import Header from "@/components/Header";
import PostDetail from "@/components/PostDetail";

export default function PostView({ id }: { id: string }) {
  return (
    <LangProvider>
      <Header />
      <PostDetail id={id} />
    </LangProvider>
  );
}
