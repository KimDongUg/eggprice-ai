"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateAlert } from "@/lib/queries";
import { useAuthStore } from "@/stores/auth";
import type { AlertCreate } from "@/types";
import { GRADES } from "@/types";

interface Props {
  onCreated: () => void;
}

export default function AlertForm({ onCreated }: Props) {
  const { user } = useAuthStore();

  const [form, setForm] = useState<AlertCreate>({
    email: user?.email || "",
    phone: "",
    grade: "특란",
    condition: "above",
    threshold_price: 0,
    notify_email: true,
    notify_sms: false,
  });
  const [success, setSuccess] = useState(false);

  const mutation = useCreateAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!form.email || form.threshold_price <= 0) return;
    if (!form.notify_email && !form.notify_sms) return;
    if (form.notify_sms && !form.phone) return;

    mutation.mutate(form, {
      onSuccess: () => {
        setSuccess(true);
        setForm({
          email: "",
          phone: "",
          grade: "특란",
          condition: "above",
          threshold_price: 0,
          notify_email: true,
          notify_sms: false,
        });
        onCreated();
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 알림 등록</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alert-email">이메일</Label>
              <Input
                id="alert-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-phone">전화번호</Label>
              <Input
                id="alert-phone"
                type="tel"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="010-1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-grade">등급</Label>
              <select
                id="alert-grade"
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-condition">조건</Label>
              <select
                id="alert-condition"
                value={form.condition}
                onChange={(e) =>
                  setForm({
                    ...form,
                    condition: e.target.value as "above" | "below",
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="above">이상 (above)</option>
                <option value="below">이하 (below)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-price">기준 가격 (원)</Label>
              <Input
                id="alert-price"
                type="number"
                value={form.threshold_price || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    threshold_price: Number(e.target.value),
                  })
                }
                placeholder="예: 6000"
                min={0}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>알림 수단</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notify_email}
                  onChange={(e) => setForm({ ...form, notify_email: e.target.checked })}
                  className="rounded border-input"
                />
                이메일
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notify_sms}
                  onChange={(e) => setForm({ ...form, notify_sms: e.target.checked })}
                  className="rounded border-input"
                />
                문자(SMS)
              </label>
            </div>
            {!form.notify_email && !form.notify_sms && (
              <p className="text-xs text-destructive">하나 이상의 알림 수단을 선택해주세요.</p>
            )}
            {form.notify_sms && !form.phone && (
              <p className="text-xs text-destructive">문자 알림을 위해 전화번호를 입력해주세요.</p>
            )}
          </div>

          {mutation.isError && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "알림 생성에 실패했습니다."}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-700 bg-green-50 rounded-lg p-3">
              알림이 등록되었습니다.
            </div>
          )}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "등록 중..." : "알림 등록"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
