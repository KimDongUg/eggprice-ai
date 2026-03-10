"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { name: "오늘 가격", free: true, standard: true, pro: true },
  { name: "7일 예측", free: true, standard: true, pro: true },
  { name: "뉴스", free: true, standard: true, pro: true },
  { name: "30일 예측", free: false, standard: true, pro: true },
  { name: "주간 리포트", free: false, standard: true, pro: true },
  { name: "가격 알림", free: false, standard: true, pro: true },
  { name: "60일 예측", free: false, standard: false, pro: true },
  { name: "시장 분석", free: false, standard: false, pro: true },
  { name: "SMS 알림", free: false, standard: false, pro: true },
];

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">구독 서비스</h1>
        <p className="text-muted-foreground">나에게 맞는 플랜을 선택하세요</p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Free */}
        <Card>
          <CardContent className="p-6 pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Free</h3>
            <p className="text-sm text-muted-foreground mb-4">일반 대중</p>
            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900">무료</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm">
              {["오늘 가격 확인", "7일 가격 예측", "뉴스 열람", "예측 정확도 확인"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full" variant="outline">
              현재 플랜
            </Button>
          </CardContent>
        </Card>

        {/* Standard */}
        <Card className="relative border-2 border-secondary-400 shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary-400 text-white text-xs font-bold px-4 py-1 rounded-full">
            인기
          </div>
          <CardContent className="p-6 pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Standard</h3>
            <p className="text-sm text-muted-foreground mb-4">양계 업계 종사자</p>
            <div className="mb-6">
              <span className="text-3xl font-bold text-secondary-600">49,000</span>
              <span className="text-muted-foreground">원/월</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm">
              {["Free 기능 전체 포함", "30일 가격 예측", "주간 브리핑 리포트", "가격 알림 (이메일)", "구매 권장 시점 제안"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full bg-secondary-500 hover:bg-secondary-600 text-white" asChild>
              <a href="tel:010-3526-4754">상담 후 가입</a>
            </Button>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="relative border-2 border-primary-400 shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-400 text-white text-xs font-bold px-4 py-1 rounded-full">
            추천
          </div>
          <CardContent className="p-6 pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Pro</h3>
            <p className="text-sm text-muted-foreground mb-4">대형 거래처 · 유통업체</p>
            <div className="mb-6">
              <span className="text-3xl font-bold text-primary-400">129,000</span>
              <span className="text-muted-foreground">원/월</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm">
              {["Standard 전체 포함", "60일 가격 예측", "급등락 알림 (SMS/카카오톡)", "시장 요인 분석 리포트"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full bg-primary-400 hover:bg-primary-500 text-white" asChild>
              <a href="tel:010-3526-4754">상담 후 가입</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature comparison table */}
      <Card className="max-w-5xl mx-auto">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium">기능</th>
                  <th className="text-center py-3 px-4 font-medium">Free</th>
                  <th className="text-center py-3 px-4 font-medium text-secondary-600">Standard</th>
                  <th className="text-center py-3 px-4 font-medium text-primary-400">Pro</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feat) => (
                  <tr key={feat.name} className="border-b last:border-0">
                    <td className="py-3 px-4">{feat.name}</td>
                    <td className="py-3 px-4 text-center">
                      {feat.free ? <CheckCircle2 className="h-4 w-4 text-success-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {feat.standard ? <CheckCircle2 className="h-4 w-4 text-secondary-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {feat.pro ? <CheckCircle2 className="h-4 w-4 text-primary-400 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center py-8">
        <h3 className="text-lg font-bold mb-2">궁금한 점이 있으신가요?</h3>
        <p className="text-sm text-muted-foreground mb-4">전화 또는 이메일로 편하게 문의하세요.</p>
        <div className="flex gap-3 justify-center">
          <Button className="bg-primary-400 hover:bg-primary-500 text-white" asChild>
            <a href="tel:010-3526-4754"><Phone className="h-4 w-4 mr-1" />전화 상담</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:kduaro124@naver.com"><Mail className="h-4 w-4 mr-1" />이메일 문의</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
