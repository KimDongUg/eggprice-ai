"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, PenSquare, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";

interface PostListItem {
  id: number;
  title: string;
  author_name: string;
  views: number;
  created_at: string;
}

interface PostListResponse {
  items: PostListItem[];
  total: number;
  page: number;
  per_page: number;
}

export default function CommunityPage() {
  const [data, setData] = useState<PostListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 20;

  useEffect(() => {
    setLoading(true);
    api
      .get("/community/posts", { params: { page, per_page: perPage } })
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = data ? Math.ceil(data.total / perPage) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">자유게시판</h1>
          <p className="text-muted-foreground text-sm">
            자유로운 주제로 소통하는 커뮤니티 공간
          </p>
        </div>
        <Button
          className="bg-primary-400 hover:bg-primary-500 text-white"
          asChild
        >
          <Link href="/community/write">
            <PenSquare className="h-4 w-4 mr-1" />
            글쓰기
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-center py-3 px-4 font-medium w-16">번호</th>
                    <th className="text-left py-3 px-4 font-medium">제목</th>
                    <th className="text-center py-3 px-4 font-medium w-24">작성자</th>
                    <th className="text-center py-3 px-4 font-medium w-20">
                      <Eye className="h-3.5 w-3.5 mx-auto" />
                    </th>
                    <th className="text-center py-3 px-4 font-medium w-28">날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-center text-muted-foreground">
                        {post.id}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/community/${post.id}`}
                          className="hover:text-primary-400 transition-colors font-medium"
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">
                        {post.author_name}
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">
                        {post.views}
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground text-xs">
                        {new Date(post.created_at).toLocaleDateString("ko-KR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                아직 게시글이 없습니다. 첫 번째 글을 작성해보세요!
              </p>
              <Button
                className="bg-primary-400 hover:bg-primary-500 text-white"
                asChild
              >
                <Link href="/community/write">글쓰기</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
