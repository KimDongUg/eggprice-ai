"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye, Calendar, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";

interface PostDetail {
  id: number;
  title: string;
  content: string;
  author_name: string;
  views: number;
  created_at: string;
  updated_at: string;
}

export default function CommunityPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    api
      .get(`/community/posts/${postId}`)
      .then((r) => setPost(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleDelete = async () => {
    if (!deletePassword.trim()) {
      setDeleteError("비밀번호를 입력해주세요.");
      return;
    }
    try {
      await api.delete(`/community/posts/${postId}`, {
        data: { password: deletePassword },
      });
      router.push("/community");
    } catch {
      setDeleteError("비밀번호가 일치하지 않습니다.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-muted-foreground mb-4">게시글을 찾을 수 없습니다.</p>
        <Button variant="outline" asChild>
          <Link href="/community">목록으로</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/community">
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록
        </Link>
      </Button>

      <Card>
        <CardContent className="p-6">
          <h1 className="text-xl font-bold mb-3">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-4 border-b">
            <span className="font-medium text-gray-700">{post.author_name}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.created_at).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.views}
            </span>
          </div>

          <div className="whitespace-pre-wrap text-sm leading-relaxed min-h-[200px]">
            {post.content}
          </div>
        </CardContent>
      </Card>

      {/* Delete section */}
      <div className="flex justify-end">
        {!showDelete ? (
          <Button
            variant="outline"
            size="sm"
            className="text-danger-500 hover:text-danger-600"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            삭제
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError("");
              }}
              placeholder="비밀번호"
              className="border rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
            >
              확인
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowDelete(false);
                setDeletePassword("");
                setDeleteError("");
              }}
            >
              취소
            </Button>
            {deleteError && (
              <span className="text-xs text-danger-500">{deleteError}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
