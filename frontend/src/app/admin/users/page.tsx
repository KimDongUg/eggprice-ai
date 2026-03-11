"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ShieldCheck, Ban } from "lucide-react";
import api from "@/lib/axios";

interface UserItem {
  id: number;
  email: string | null;
  name: string | null;
  provider: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  analyst: "bg-blue-100 text-blue-700",
  user: "bg-gray-100 text-gray-700",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "관리자",
  analyst: "분석가",
  user: "일반",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api.get("/admin/users", { params: { per_page: 200 } })
      .then((r) => {
        setUsers(r.data.items);
        setTotal(r.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const changeRole = async (userId: number, role: string) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
    fetchUsers();
  };

  const toggleActive = async (userId: number) => {
    await api.patch(`/admin/users/${userId}/toggle-active`);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          사용자 관리
        </h1>
        <Badge variant="secondary">{total}명</Badge>
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
                    <th className="text-left py-3 px-4 font-medium">ID</th>
                    <th className="text-left py-3 px-4 font-medium">이메일</th>
                    <th className="text-left py-3 px-4 font-medium">이름</th>
                    <th className="text-center py-3 px-4 font-medium">로그인</th>
                    <th className="text-center py-3 px-4 font-medium">역할</th>
                    <th className="text-center py-3 px-4 font-medium">상태</th>
                    <th className="text-center py-3 px-4 font-medium">가입일</th>
                    <th className="text-center py-3 px-4 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-muted-foreground">{u.id}</td>
                      <td className="py-3 px-4 font-mono text-xs">{u.email || "-"}</td>
                      <td className="py-3 px-4">{u.name || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="text-xs">{u.provider}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={ROLE_BADGE[u.role] || ROLE_BADGE.user}>
                          {ROLE_LABEL[u.role] || u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {u.is_active ? (
                          <Badge className="bg-green-100 text-green-700">활성</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">비활성</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <select
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                          >
                            <option value="user">일반</option>
                            <option value="analyst">분석가</option>
                            <option value="admin">관리자</option>
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => toggleActive(u.id)}
                            title={u.is_active ? "비활성화" : "활성화"}
                          >
                            {u.is_active ? <Ban className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
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
