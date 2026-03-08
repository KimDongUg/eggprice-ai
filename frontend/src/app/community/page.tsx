"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, ShoppingBag, Coffee } from "lucide-react";
import Link from "next/link";

const BOARDS = [
  {
    icon: <Users className="h-6 w-6 text-primary-400" />,
    title: "양계 농가 게시판",
    description: "양계 농가 종사자들의 정보 공유 및 소통 공간",
    count: 0,
    slug: "farmers",
  },
  {
    icon: <ShoppingBag className="h-6 w-6 text-blue-500" />,
    title: "도매업자 게시판",
    description: "도매업자간 시장 정보, 가격 동향 공유",
    count: 0,
    slug: "wholesale",
  },
  {
    icon: <Coffee className="h-6 w-6 text-orange-500" />,
    title: "시장 이야기 (자유 게시판)",
    description: "자유로운 주제로 업계 이야기를 나누세요",
    count: 0,
    slug: "general",
  },
];

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">커뮤니티</h1>
        <p className="text-muted-foreground text-sm">
          업계 종사자들의 정보 공유 및 소통 공간
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BOARDS.map((board) => (
          <Card key={board.slug} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                {board.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{board.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{board.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">게시글 {board.count}개</span>
                <Button variant="outline" size="sm" disabled>
                  준비중
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming soon notice */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50">
        <CardContent className="py-8 text-center">
          <MessageSquare className="h-10 w-10 text-primary-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-2">커뮤니티 준비 중</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            양계 업계 종사자를 위한 전문 커뮤니티를 준비하고 있습니다.
            관심 있으시면 알림을 신청해 주세요.
          </p>
          <Button className="bg-primary-400 hover:bg-primary-500 text-white" asChild>
            <Link href="/register">회원가입하고 알림받기</Link>
          </Button>
        </CardContent>
      </Card>

      {/* AdSense placeholder */}
      <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg p-4 text-center">
        <span className="text-xs text-muted-foreground">광고 영역 (Google AdSense)</span>
      </div>
    </div>
  );
}
