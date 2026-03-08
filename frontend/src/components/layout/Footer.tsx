import Link from "next/link";
import Image from "next/image";
import { Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 브랜드 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="슬기알 로고"
                width={32}
                height={32}
              />
              <span className="text-lg font-bold text-white">
                슬기알
                <span className="text-xs font-medium text-gray-500 ml-1">
                  계란가격예측 AI
                </span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              업계 실무 경험 + AI 분석 기반
              <br />
              출하 의사결정 브리핑 서비스
            </p>
            <p className="text-xs text-gray-500">
              데이터 출처:{" "}
              <a
                href="https://www.kamis.or.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-gray-400"
              >
                KAMIS 농산물유통정보
              </a>
            </p>
          </div>

          {/* 서비스 링크 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">서비스</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/price" className="hover:text-white transition-colors">
                  오늘 계란 가격
                </Link>
              </li>
              <li>
                <Link href="/prediction" className="hover:text-white transition-colors">
                  AI 가격 예측
                </Link>
              </li>
              <li>
                <Link href="/accuracy" className="hover:text-white transition-colors">
                  예측 정확도
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white transition-colors">
                  뉴스
                </Link>
              </li>
              <li>
                <Link href="/analysis" className="hover:text-white transition-colors">
                  시장 분석
                </Link>
              </li>
              <li>
                <Link href="/data" className="hover:text-white transition-colors">
                  가격 데이터
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-white transition-colors">
                  가격 비교
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-white transition-colors">
                  커뮤니티
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  구독 서비스
                </Link>
              </li>
            </ul>
          </div>

          {/* 연락처 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">상담 문의</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:010-0000-0000" className="hover:text-white transition-colors">
                  010-0000-0000
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:contact@eggprice.kr" className="hover:text-white transition-colors">
                  contact@eggprice.kr
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              개인정보처리방침
            </Link>
            <span className="text-gray-700">|</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              이용약관
            </Link>
            <span className="text-gray-700">|</span>
            <Link href="/refund" className="hover:text-white transition-colors">
              환불정책
            </Link>
          </div>
          <span>&copy; 2026 슬기알(계란가격예측 AI). All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
