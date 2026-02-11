import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "환불정책",
  description: "EggPrice AI 프리미엄 구독 환불정책",
};

export default function RefundPage() {
  return (
    <article className="prose prose-gray max-w-3xl mx-auto">
      <h1>프리미엄 구독 환불정책</h1>
      <p className="text-sm text-muted-foreground">시행일: 2026년 1월 1일</p>

      <h2>제1조 (구독 상품 안내)</h2>
      <ul>
        <li>
          프리미엄 회원은 월간 또는 연간 구독 방식으로 서비스를 이용할 수
          있습니다.
        </li>
        <li>구독은 결제일 기준으로 자동 갱신됩니다.</li>
        <li>
          회원은 언제든지 마이페이지에서 구독 해지를 신청할 수 있습니다.
        </li>
      </ul>

      <h2>제2조 (청약철회 및 환불 기준)</h2>

      <h3>① 결제 후 7일 이내 (서비스 미이용 시)</h3>
      <ul>
        <li>결제일로부터 7일 이내</li>
        <li>프리미엄 서비스 이용 이력이 없는 경우</li>
      </ul>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 not-prose">
        <p className="font-semibold text-blue-800">전액 환불</p>
      </div>

      <h3>② 서비스 이용 후 환불</h3>
      <ul>
        <li>결제일로부터 7일 이내라도</li>
        <li>
          콘텐츠 열람, 다운로드, 기능 사용 등 서비스 이용 기록이 있는 경우
        </li>
      </ul>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 not-prose">
        <p className="font-semibold text-blue-800">
          이용일수 차감 후 환불
        </p>
        <p className="mt-2 text-sm text-blue-700">
          환불금액 = 결제금액 &ndash; (일할 계산 이용금액) &ndash; 결제 수수료
        </p>
      </div>

      <h3>③ 7일 경과 후</h3>
      <ul>
        <li>
          <strong>월간 구독:</strong> 사용한 기간을 제외한 잔여 기간에 대해
          일할 계산 후 환불
        </li>
        <li>
          <strong>연간 구독:</strong> 남은 기간에 대해 일할 계산 후 환불
        </li>
      </ul>
      <p className="text-sm text-muted-foreground">
        ※ 단, 프로모션 할인 상품은 별도 조건 적용 가능
      </p>

      <h2>제3조 (환불 불가 사유)</h2>
      <p>다음의 경우 환불이 제한될 수 있습니다:</p>
      <ul>
        <li>무료 체험 후 자동 전환된 구독</li>
        <li>
          환불을 반복적으로 요청하여 서비스 운영에 중대한 영향을 주는 경우
        </li>
        <li>
          관계 법령상 청약철회가 제한되는 디지털 콘텐츠를 다운로드한 경우
        </li>
      </ul>

      <h2>제4조 (자동 갱신 해지)</h2>
      <ul>
        <li>
          자동 갱신은 다음 결제일 24시간 이전까지 해지 신청해야 합니다.
        </li>
        <li>해지 신청 시 다음 결제부터 과금되지 않습니다.</li>
        <li>이미 결제된 금액은 위 환불 규정에 따릅니다.</li>
      </ul>

      <h2>제5조 (환불 처리 기간)</h2>
      <ul>
        <li>
          <strong>카드 결제:</strong> 승인 취소 처리 후 3~7영업일 소요
        </li>
        <li>
          <strong>계좌 환불:</strong> 3영업일 이내 처리
        </li>
      </ul>

      <h2>월간/연간 구독 참고사항</h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 not-prose">
        <p className="font-semibold text-yellow-800">연간 구독 중도 해지</p>
        <p className="mt-2 text-sm text-yellow-700">
          연간 구독을 중도 해지하는 경우, 이용일수를 일할 계산하여 잔여 금액을
          환불합니다. 과도한 위약금은 부과하지 않습니다.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 not-prose mt-4">
        <p className="font-semibold text-green-800">환불 정책 요약</p>
        <ul className="mt-2 space-y-1 text-sm text-green-700">
          <li>7일 이내 전액 환불 (미사용 조건)</li>
          <li>이후 일할 계산 환불</li>
          <li>연간 위약금 없음</li>
        </ul>
      </div>

      <h2>부칙</h2>
      <p>본 환불정책은 2026년 1월 1일부터 시행됩니다.</p>
    </article>
  );
}
