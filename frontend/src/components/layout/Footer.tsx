import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>계란가격 예측(EggPrice AI) - LSTM 기반 계란 가격 예측 서비스</p>
          <p>
            데이터 출처:{" "}
            <a
              href="https://www.kamis.or.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              KAMIS 농산물유통정보
            </a>
          </p>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:underline">
            개인정보처리방침
          </Link>
          <span>|</span>
          <Link href="/terms" className="hover:underline">
            이용약관
          </Link>
          <span>|</span>
          <span>&copy; 2026 계란가격 예측(EggPrice AI)</span>
        </div>
      </div>
    </footer>
  );
}
