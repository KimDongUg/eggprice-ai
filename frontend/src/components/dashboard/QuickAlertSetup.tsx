"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendReport } from "@/lib/queries";

export default function QuickAlertSetup() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useSendReport();

  const handleSubmit = () => {
    if (!email) return;
    setSuccess(false);

    mutation.mutate(
      { email },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary-400" />
          계란 예측 결과 이메일 전송
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소를 입력하세요"
            className="flex-1"
          />
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !email}
            className="shrink-0"
          >
            {success ? (
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4" /> 전송 완료
              </span>
            ) : mutation.isPending ? (
              "전송 중..."
            ) : (
              "리포트 전송"
            )}
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-xs text-destructive mt-2">
            이메일 전송에 실패했습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
