"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Trash2 } from "lucide-react";
import api from "@/lib/axios";

interface PostItem {
  id: number;
  title: string;
  author_name: string;
  views: number;
  comment_count: number;
  created_at: string;
}

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    api.get("/admin/community/posts", { params: { per_page: 100 } })
      .then((r) => {
        setPosts(r.data.items);
        setTotal(r.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const deletePost = async (id: number) => {
    if (!confirm(`게시글 #${id}을(를) 삭제하시겠습니까? 댓글도 함께 삭제됩니다.`)) return;
    await api.delete(`/admin/community/posts/${id}`);
    fetchPosts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          커뮤니티 관리
        </h1>
        <Badge variant="secondary">{total}개 게시글</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-center py-3 px-4 font-medium w-16">ID</th>
                    <th className="text-left py-3 px-4 font-medium">제목</th>
                    <th className="text-center py-3 px-4 font-medium w-24">작성자</th>
                    <th className="text-center py-3 px-4 font-medium w-16">조회</th>
                    <th className="text-center py-3 px-4 font-medium w-16">댓글</th>
                    <th className="text-center py-3 px-4 font-medium w-28">날짜</th>
                    <th className="text-center py-3 px-4 font-medium w-16">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-center text-muted-foreground">{p.id}</td>
                      <td className="py-3 px-4 font-medium">{p.title}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{p.author_name}</td>
                      <td className="py-3 px-4 text-center">{p.views}</td>
                      <td className="py-3 px-4 text-center">
                        {p.comment_count > 0 ? (
                          <Badge className="bg-blue-100 text-blue-700">{p.comment_count}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-danger-500 hover:text-danger-600"
                          onClick={() => deletePost(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
