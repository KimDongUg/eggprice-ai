"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateAlert } from "@/lib/queries";
import { GRADES } from "@/types";

export default function QuickAlertSetup() {
  const [grade, setGrade] = useState("대란");
  const [price, setPrice] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useCreateAlert();

  const handleSubmit = () => {
    if (!email || !price) return;
    setSuccess(false);

    mutation.mutate(
      {
        email,
        grade,
        condition: "below",
        threshold_price: Number(price),
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setPrice("");
          setTimeout(() => setSuccess(false), 3000);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-primary-400" />
          빠른 알림 설정
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 flex-1">
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="예: 2500"
              className="flex-1"
              min={0}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              원 이하 시 알림
            </span>
          </div>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className="sm:w-48"
          />
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !email || !price}
            className="shrink-0"
          >
            {success ? (
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4" /> 완료
              </span>
            ) : mutation.isPending ? (
              "설정 중..."
            ) : (
              "설정하기"
            )}
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-xs text-destructive mt-2">
            알림 설정에 실패했습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
