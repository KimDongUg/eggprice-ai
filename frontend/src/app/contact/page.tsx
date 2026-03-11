"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Clock, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // mailto fallback — no backend endpoint needed
    const mailto = `mailto:kduaro124@naver.com?subject=${encodeURIComponent(
      `[슬기알 문의] ${form.subject}`
    )}&body=${encodeURIComponent(
      `이름: ${form.name}\n이메일: ${form.email}\n\n${form.message}`
    )}`;
    window.open(mailto, "_blank");
    setSent(true);
    setSending(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-1">문의하기</h1>
        <p className="text-muted-foreground text-sm">
          서비스 이용 중 궁금한 점이 있으시면 아래 양식으로 문의해 주세요.
        </p>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary-400 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">이메일</p>
              <a href="mailto:kduaro124@naver.com" className="text-sm font-medium hover:text-primary-400">
                kduaro124@naver.com
              </a>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary-400 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">전화</p>
              <a href="tel:010-3526-4754" className="text-sm font-medium hover:text-primary-400">
                010-3526-4754
              </a>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary-400 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">응답 시간</p>
              <p className="text-sm font-medium">영업일 1~2일</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact form */}
      <Card>
        <CardContent className="p-6">
          {sent ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-success-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-1">메일 앱이 열렸습니다</h3>
              <p className="text-sm text-muted-foreground">
                메일 앱에서 전송을 완료해 주세요. 영업일 기준 1~2일 이내 답변드리겠습니다.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSent(false);
                  setForm({ name: "", email: "", subject: "", message: "" });
                }}
              >
                새 문의 작성
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">이름</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">이메일</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">제목</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="문의 제목을 입력해 주세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">문의 내용</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                  placeholder="문의 내용을 입력해 주세요"
                />
              </div>
              <Button type="submit" className="w-full bg-primary-400 hover:bg-primary-500 text-white" disabled={sending}>
                {sending ? "전송 중..." : "문의 보내기"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
