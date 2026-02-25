"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpsertPrice } from "@/lib/admin-queries";
import { GRADES } from "@/types";

export default function PriceInputForm() {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    grade: "대란",
    wholesale_price: "",
    retail_price: "",
    reason: "",
  });
  const mutation = useUpsertPrice();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      date: form.date,
      grade: form.grade,
      wholesale_price: form.wholesale_price ? Number(form.wholesale_price) : null,
      retail_price: form.retail_price ? Number(form.retail_price) : null,
      reason: form.reason || undefined,
    });
  };

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">가격 수동 입력 / 수정</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price-date">날짜</Label>
            <Input
              id="price-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="price-grade">등급</Label>
            <select
              id="price-grade"
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="wholesale">도매가(원)</Label>
            <Input
              id="wholesale"
              type="number"
              placeholder="도매가"
              value={form.wholesale_price}
              onChange={(e) => setForm({ ...form, wholesale_price: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="retail">소매가(원)</Label>
            <Input
              id="retail"
              type="number"
              placeholder="소매가"
              value={form.retail_price}
              onChange={(e) => setForm({ ...form, retail_price: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <Label htmlFor="reason">사유</Label>
            <Input
              id="reason"
              placeholder="수정 사유 (선택)"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
        {mutation.isSuccess && (
          <p className="text-sm text-green-600 mt-3">저장되었습니다.</p>
        )}
        {mutation.isError && (
          <p className="text-sm text-red-600 mt-3">저장에 실패했습니다.</p>
        )}
      </CardContent>
    </Card>
  );
}
