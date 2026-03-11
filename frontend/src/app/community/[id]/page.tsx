"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye, Calendar, Trash2, MessageCircle, Send } from "lucide-react";
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

interface Comment {
  id: number;
  post_id: number;
  content: string;
  author_name: string;
  created_at: string;
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

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentPassword, setCommentPassword] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  // Comment delete
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [commentDeletePw, setCommentDeletePw] = useState("");
  const [commentDeleteError, setCommentDeleteError] = useState("");

  const fetchComments = useCallback(() => {
    api
      .get(`/community/posts/${postId}/comments`)
      .then((r) => setComments(r.data))
      .catch(() => {});
  }, [postId]);

  useEffect(() => {
    api
      .get(`/community/posts/${postId}`)
      .then((r) => setPost(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchComments();
  }, [postId, fetchComments]);

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

  const handleCommentSubmit = async () => {
    if (!commentContent.trim() || !commentAuthor.trim() || !commentPassword.trim()) {
      setCommentError("닉네임, 비밀번호, 내용을 모두 입력해주세요.");
      return;
    }
    setCommentSubmitting(true);
    setCommentError("");
    try {
      await api.post(`/community/posts/${postId}/comments`, {
        content: commentContent,
        author_name: commentAuthor,
        password: commentPassword,
      });
      setCommentContent("");
      fetchComments();
    } catch {
      setCommentError("댓글 등록에 실패했습니다.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!commentDeletePw.trim()) {
      setCommentDeleteError("비밀번호를 입력해주세요.");
      return;
    }
    try {
      await api.delete(`/community/comments/${commentId}`, {
        data: { password: commentDeletePw },
      });
      setDeletingCommentId(null);
      setCommentDeletePw("");
      setCommentDeleteError("");
      fetchComments();
    } catch {
      setCommentDeleteError("비밀번호가 일치하지 않습니다.");
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

      {/* ── 댓글 섹션 ── */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            댓글 {comments.length > 0 && <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>}
          </h2>

          {/* 댓글 목록 */}
          {comments.length > 0 ? (
            <div className="space-y-4 mb-6">
              {comments.map((c) => (
                <div key={c.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("ko-KR", {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {deletingCommentId === c.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="password"
                          value={commentDeletePw}
                          onChange={(e) => {
                            setCommentDeletePw(e.target.value);
                            setCommentDeleteError("");
                          }}
                          placeholder="비밀번호"
                          className="border rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs px-2"
                          onClick={() => handleCommentDelete(c.id)}
                        >
                          확인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2"
                          onClick={() => {
                            setDeletingCommentId(null);
                            setCommentDeletePw("");
                            setCommentDeleteError("");
                          }}
                        >
                          취소
                        </Button>
                        {commentDeleteError && (
                          <span className="text-xs text-danger-500">{commentDeleteError}</span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingCommentId(c.id)}
                        className="text-xs text-muted-foreground hover:text-danger-500 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
            </p>
          )}

          {/* 댓글 작성 */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="닉네임"
                maxLength={50}
                className="border rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <input
                type="password"
                value={commentPassword}
                onChange={(e) => setCommentPassword(e.target.value)}
                placeholder="비밀번호 (삭제 시 필요)"
                maxLength={50}
                className="border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div className="flex gap-2">
              <textarea
                value={commentContent}
                onChange={(e) => {
                  setCommentContent(e.target.value);
                  setCommentError("");
                }}
                placeholder="댓글을 입력하세요..."
                rows={2}
                maxLength={1000}
                className="border rounded-lg px-3 py-2 text-sm flex-1 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <Button
                className="bg-primary-400 hover:bg-primary-500 text-white self-end"
                onClick={handleCommentSubmit}
                disabled={commentSubmitting}
              >
                <Send className="h-4 w-4 mr-1" />
                등록
              </Button>
            </div>
            {commentError && (
              <p className="text-xs text-danger-500">{commentError}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
