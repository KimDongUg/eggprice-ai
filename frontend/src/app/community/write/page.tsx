"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";

export default function CommunityWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !authorName.trim() || !password.trim()) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    if (password.length < 4) {
      setError("비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/community/posts", {
        title: title.trim(),
        content: content.trim(),
        author_name: authorName.trim(),
        password,
      });
      router.push(`/community/${res.data.id}`);
    } catch {
      setError("글 작성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/community">
            <ArrowLeft className="h-4 w-4 mr-1" />
            목록
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">글쓰기</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">작성자</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="닉네임"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="수정/삭제 시 필요 (4자 이상)"
                  maxLength={50}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="제목을 입력하세요"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[200px] resize-y"
                placeholder="내용을 입력하세요"
              />
            </div>

            {error && (
              <p className="text-sm text-danger-500">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/community">취소</Link>
              </Button>
              <Button
                type="submit"
                className="bg-primary-400 hover:bg-primary-500 text-white"
                disabled={submitting}
              >
                {submitting ? "작성 중..." : "작성하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
