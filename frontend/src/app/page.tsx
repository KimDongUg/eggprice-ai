"use client";

import Image from "next/image";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  Phone,
  Mail,
  FileText,
  Bell,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Users,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentPrices, useForecast } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export default function LandingPage() {
  const { data: prices } = useCurrentPrices();
  const { data: forecast } = useForecast("특란");

  const teukranPrice = prices?.find((p) => p.grade === "특란");

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* ─── 창립 멤버 배너 ─── */}
      <div className="bg-gradient-to-r from-primary-400 to-secondary-500 text-white text-center py-3 px-4">
        <p className="text-sm font-semibold">
          <Target className="inline h-4 w-4 mr-1 -mt-0.5" />
          창립 멤버 20명 한정 &mdash; 월 49,000원 (6개월 고정가)
          <Link
            href="/pricing"
            className="ml-2 underline underline-offset-2 hover:no-underline"
          >
            자세히 보기
          </Link>
        </p>
      </div>

      {/* ─── Hero Section ─── */}
      <section className="bg-gradient-to-br from-gray-50 via-white to-secondary-50 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Image
                  src="/logo.png"
                  alt="슬기알 로고"
                  width={64}
                  height={64}
                />
                <span className="text-2xl font-bold text-gray-900">슬기알</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                AI 기반
                <br />
                <span className="text-primary-400">계란 가격 예측 플랫폼</span>
              </h1>
              <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                KAMIS 데이터 + AI 분석으로{" "}
                <strong className="text-gray-900">정확한 가격 예측</strong>을 제공합니다.
                <br />
                양계업+유통업 경험 기반의 실전 판단 가이드.
              </p>

              {/* 오늘 특란 가격 표시 */}
              {teukranPrice && (
                <div className="bg-white border rounded-xl p-4 mb-6 inline-block shadow-sm">
                  <span className="text-sm text-muted-foreground">오늘 특란 30구 도매가 (서울)</span>
                  <p className="text-2xl font-bold font-mono-num text-gray-900">
                    {teukranPrice.wholesale_price?.toLocaleString() ?? "-"}
                    <span className="text-base font-normal text-muted-foreground ml-1">원</span>
                    {teukranPrice.daily_change !== null && teukranPrice.daily_change !== undefined && (
                      <span className={`text-sm ml-2 ${teukranPrice.daily_change > 0 ? "text-danger-500" : teukranPrice.daily_change < 0 ? "text-success-500" : "text-muted-foreground"}`}>
                        {teukranPrice.daily_change > 0 ? "+" : ""}{teukranPrice.daily_change.toLocaleString()}원
                      </span>
                    )}
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground mb-8">
                계란을 좋아하는 일반인 &middot; 계란 도매상 &middot; 유통업체 &middot; 식자재 납품업체를 위한 서비스
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-primary-400 hover:bg-primary-500 text-white text-base px-8 py-6"
                  asChild
                >
                  <Link href="/prediction">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    AI 예측 전체 보기
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-6 border-gray-300"
                  asChild
                >
                  <Link href="/price">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    오늘 시세 보기
                  </Link>
                </Button>
              </div>
            </div>

            {/* Hero 우측: 7일 예측 요약 카드 */}
            <div className="relative">
              <Card className="border-2 border-primary-100 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-muted-foreground">
                      AI 7일 예측 요약
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    이번 주 가격 전망
                  </h3>
                  {forecast ? (
                    <>
                      <div className="space-y-3 mb-5">
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <span className="font-medium text-gray-900">특란 (30개)</span>
                          <div className="flex items-center gap-2">
                            {forecast.trend === "상승" && <TrendingUp className="h-4 w-4 text-danger-500" />}
                            {forecast.trend === "하락" && <TrendingDown className="h-4 w-4 text-blue-600" />}
                            <span className={`text-sm font-semibold ${forecast.trend === "상승" ? "text-danger-500" : forecast.trend === "하락" ? "text-blue-600" : "text-orange-600"}`}>
                              {forecast.trend} 전망
                            </span>
                          </div>
                        </div>
                        {forecast.predictions.length >= 7 && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="font-medium text-gray-900">7일 후 예측가</span>
                            <span className="text-sm font-semibold text-gray-900 font-mono-num">
                              {forecast.predictions[6].price.toLocaleString()}원
                              <span className={`ml-1 text-xs ${forecast.predictions[6].change_percent > 0 ? "text-danger-500" : forecast.predictions[6].change_percent < 0 ? "text-success-500" : "text-muted-foreground"}`}>
                                ({forecast.predictions[6].change_percent > 0 ? "+" : ""}{forecast.predictions[6].change_percent}%)
                              </span>
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <span className="font-medium text-gray-900">현재 도매가</span>
                          <span className="text-sm font-semibold text-gray-900 font-mono-num">
                            {forecast.current_price?.toLocaleString() ?? "-"}원
                          </span>
                        </div>
                      </div>

                      <Link
                        href="/prediction"
                        className="block bg-primary-50 border border-primary-200 rounded-lg p-4 hover:bg-primary-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-primary-700">
                            AI 예측 전체 보기
                          </span>
                          <ArrowRight className="h-4 w-4 text-primary-400" />
                        </div>
                      </Link>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Skeleton className="h-12 rounded-lg" />
                      <Skeleton className="h-12 rounded-lg" />
                      <Skeleton className="h-12 rounded-lg" />
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="absolute -top-3 -right-3 bg-secondary-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                매일 업데이트
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 문제 제기 섹션 ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            이런 고민, 하고 계시죠?
          </h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            계란 가격 변동은 수익에 직결됩니다. 감에 의존하면 리스크가 커집니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "😰",
                title: "구매 시점 판단이 어렵다",
                desc: "지금 팔까, 며칠 더 기다릴까? 매번 고민됩니다.",
              },
              {
                icon: "📉",
                title: "급등락 대응이 늦다",
                desc: "가격이 떨어지고 나서야 알게 됩니다.",
              },
              {
                icon: "🤷",
                title: "데이터만으로는 부족하다",
                desc: "숫자는 있지만, 어떻게 행동해야 할지 모릅니다.",
              },
              {
                icon: "💸",
                title: "타이밍 실수로 손실 발생",
                desc: "하루 차이로 수백만원이 달라집니다.",
              },
            ].map((item) => (
              <Card key={item.title} className="text-left">
                <CardContent className="p-6">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 솔루션: 행동 가이드 중심 ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              슬기알은 <span className="text-primary-400">행동 가이드</span>를 드립니다
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              단순 AI 수치가 아닌, 업계 경험 기반의 실전 해석과 권장 전략을 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 className="h-6 w-6 text-primary-400" />,
                title: "AI 가격 예측",
                desc: "30일(Standard) / 60일(Pro) 가격 방향성 예측. 상승·하락 확률과 변동성 지수를 함께 제공합니다.",
              },
              {
                icon: <Target className="h-6 w-6 text-primary-400" />,
                title: "구매 권장 시점",
                desc: '단순 수치가 아닌 "구매 3~4일 지연 권장" 같은 실전 판단 가이드를 제시합니다.',
              },
              {
                icon: <FileText className="h-6 w-6 text-primary-400" />,
                title: "주간 브리핑 리포트",
                desc: "매주 월요일, 이번 주 전망과 권장 전략을 PDF/이메일로 자동 발송합니다.",
              },
              {
                icon: <Bell className="h-6 w-6 text-primary-400" />,
                title: "급등락 알림",
                desc: "급격한 가격 변동 시 즉시 SMS/카카오톡으로 알림을 보내드립니다. (Pro)",
              },
              {
                icon: <Phone className="h-6 w-6 text-primary-400" />,
                title: "월 1회 전화 브리핑",
                desc: "담당자가 직접 전화로 시장 상황과 전략을 브리핑합니다. (Pro)",
              },
              {
                icon: <Shield className="h-6 w-6 text-primary-400" />,
                title: "리스크 경고",
                desc: "급등락 위험 감지 시 사전 경고 메시지를 발송합니다.",
              },
            ].map((item) => (
              <Card key={item.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 왜 슬기알인가? (신뢰 섹션) ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                왜 <span className="text-primary-400">슬기알</span>인가?
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                AI만으로는 부족합니다. 업계를 이해하는 사람이 해석해야 진짜 정보가 됩니다.
                슬기알은 실무 경험 위에 AI를 얹었습니다.
              </p>
              <div className="space-y-4">
                {[
                  "양계업+유통업 경험 기반 분석",
                  "도매 유통 구조를 이해하는 해석",
                  "AI는 보조 도구, 핵심은 실전 판단",
                  "단순 수치가 아닌 '행동' 중심 제공",
                  "매주 직접 브리핑 → 관리받는 안심감",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success-500 shrink-0" />
                    <span className="text-gray-900 font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "양계+유통", label: "업계 실무 경험" },
                { value: "매주", label: "브리핑 리포트 발송" },
                { value: "30~60일", label: "가격 방향성 예측" },
                { value: "실시간", label: "급등락 알림 (Pro)" },
              ].map((stat) => (
                <Card key={stat.label} className="text-center">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-primary-400 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 리포트 시스템 강조 ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            관리받는 느낌, 슬기알 브리핑 시스템
          </h2>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            가입만 하면 끝이 아닙니다. 매주 직접 챙겨드립니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <FileText className="h-8 w-8" />,
                title: "주간 PDF 리포트",
                desc: "매주 월요일, 이번 주 전망·가격 방향성·권장 전략을 정리해서 발송합니다.",
              },
              {
                icon: <Bell className="h-8 w-8" />,
                title: "급등락 실시간 알림",
                desc: "예상치 못한 가격 변동이 감지되면 즉시 SMS/카카오톡으로 알려드립니다.",
              },
              {
                icon: <Phone className="h-8 w-8" />,
                title: "월 1회 전화 브리핑",
                desc: "담당자가 직접 전화로 이달의 시장 상황과 구매 전략을 안내합니다. (Pro)",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/10 backdrop-blur rounded-xl p-6"
              >
                <div className="text-secondary-300 mb-4 flex justify-center">
                  {item.icon}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 가격표 섹션 ─── */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              명확한 요금, 확실한 가치
            </h2>
            <p className="text-muted-foreground">
              B2B 서비스는 가격이 투명해야 신뢰가 생깁니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* 창립 멤버 */}
            <Card className="relative border-2 border-secondary-400 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary-400 text-white text-xs font-bold px-4 py-1 rounded-full">
                한정 20명
              </div>
              <CardContent className="p-6 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-1">창립 멤버</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  6개월 고정가 특별 혜택
                </p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-secondary-600">49,000</span>
                  <span className="text-muted-foreground">원/월</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {[
                    "Standard 기능 전체 포함",
                    "30일 가격 예측",
                    "주간 브리핑 리포트",
                    "리스크 경고 메시지",
                    "6개월 가격 고정",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-secondary-500 hover:bg-secondary-600 text-white"
                  asChild
                >
                  <a href="tel:010-3526-4754">
                    지금 신청하기
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  6개월 후 Standard로 자동 전환
                </p>
              </CardContent>
            </Card>

            {/* Standard */}
            <Card className="border">
              <CardContent className="p-6 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Standard</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  일반 도매상 · 농가
                </p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">79,000</span>
                  <span className="text-muted-foreground">원/월</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {[
                    "30일 가격 예측",
                    "방향성 요약 (상승/하락 확률)",
                    "변동성 지수",
                    "구매 권장 시점 제안",
                    "주간 브리핑 리포트 (PDF/이메일)",
                    "리스크 경고 메시지",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <a href="tel:010-3526-4754">
                    상담 후 가입
                  </a>
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
                <p className="text-sm text-muted-foreground mb-4">
                  대형 거래처 · 유통업체
                </p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-primary-400">129,000</span>
                  <span className="text-muted-foreground">원/월</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {[
                    "Standard 전체 포함",
                    "60일 가격 예측",
                    "급등락 알림 (SMS/카카오톡)",
                    "월 1회 전화 브리핑",
                    "시장 요인 분석 리포트",
                    "전담 상담 지원",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-primary-400 hover:bg-primary-500 text-white"
                  asChild
                >
                  <a href="tel:010-3526-4754">
                    상담 후 가입
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── CTA: 상담 신청 ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-400 to-primary-500 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            지금 바로 상담 받으세요
          </h2>
          <p className="text-primary-100 mb-8 leading-relaxed">
            감으로 판단하던 구매 시점, 이제 데이터와 경험이 함께합니다.
            <br />
            창립 멤버 마감 전에 상담 신청하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-primary-500 hover:bg-gray-100 text-base px-8 py-6"
              asChild
            >
              <a href="tel:010-3526-4754">
                <Phone className="h-5 w-5 mr-2" />
                전화 상담 신청
              </a>
            </Button>
            <Button
              size="lg"
              className="bg-white/20 text-white border-2 border-white hover:bg-white hover:text-primary-500 text-base px-8 py-6"
              asChild
            >
              <a href="mailto:kduaro124@naver.com">
                <Mail className="h-5 w-5 mr-2" />
                이메일 문의
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
            자주 묻는 질문
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "예측이 틀리면 어떡하나요?",
                a: '모든 예측은 확률 기반으로 표현됩니다. "상승 확률 68%"처럼 불확실성을 명확히 안내하며, 업계 경험 기반 해석을 함께 제공하여 판단을 돕습니다.',
              },
              {
                q: "어떤 데이터를 기반으로 예측하나요?",
                a: "KAMIS 농산물유통정보의 실시간 시세 데이터, 사료 가격(옥수수·대두박), 환율, 기온, 조류인플루엔자 정보 등 다양한 시장 요인을 종합 분석합니다.",
              },
              {
                q: "해지는 언제든 가능한가요?",
                a: "네, 월 단위 구독이므로 언제든 해지 가능합니다. 창립 멤버는 6개월 고정가 혜택이 적용됩니다.",
              },
              {
                q: "리포트는 어떻게 받나요?",
                a: "매주 월요일 오전, 이메일 또는 PDF로 발송됩니다. Pro 고객은 추가로 SMS/카카오톡 알림과 월 1회 전화 브리핑을 받으실 수 있습니다.",
              },
            ].map((item) => (
              <Card key={item.q}>
                <CardContent className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
