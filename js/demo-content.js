/**
 * demo-content.js — API 키 없을 때 사용하는 로컬 데모 콘텐츠 생성기
 */

'use strict';

PB.generateLocalDemoContent = function () {
  const isParis    = PB.activeDemoPreset === 'paris';
  const isOrangery = PB.activeDemoPreset === 'orangery';
  const faqBlock   = PB.chkFaq.checked;

  // 파리 에펠탑 프리셋
  if (isParis) {
    return {
      title: '파리 에펠탑 명당 뷰 & 주변 골목 카페 코스 총정리',
      body: `<h2>황금빛 빛으로 물든 에펠탑, 눈에 담아오다</h2>
<p>꿈에서 그리던 파리의 저녁, <strong>에펠탑</strong>을 눈앞에 두고 바라본 풍경은 말 그대로 숨이 멎는 광경이었습니다. 저녁 무렵 붉게 물드는 하늘 아래 빛나는 에펠탑의 모습은 사진으로도 그 감동을 다 담기 어렵습니다.</p>

<h2>카페 투어 — 에펠탑 주변 골목 탐방</h2>
<p>에펠탑 주변 좁은 골목마다 감성 넘치는 카페와 빵집이 가득합니다. 파리의 카페는 단순한 음료를 파는 공간이 아닌, 여행자에게 쉼을 선사하는 생활의 일부입니다.</p>
<ul>
  <li><strong>추천 시간:</strong> 오후 4~7시 골든아워 방문</li>
  <li><strong>추천 메뉴:</strong> 카페 크렘 + 크루아상</li>
</ul>
${faqBlock ? `<h3>★ 파리 에펠탑 여행 FAQ</h3>
<ul>
  <li><strong>Q1. 에펠탑 야경은 몇 시부터 시작되나요?</strong><br>A: 일몰 후 약 30분부터 시작됩니다.</li>
  <li><strong>Q2. 카페에서 오래 머물어도 되나요?</strong><br>A: 프랑스 카페는 대부분 여유롭게 오래 앉아있어도 괜찮습니다.</li>
  <li><strong>Q3. 입장료가 있나요?</strong><br>A: 에펠탑 1층~3층 입장권이 별도로 있습니다.</li>
</ul>` : ''}`,
      seoTitles: [
        '파리 에펠탑 명당 뷰 & 카페 코스 총정리',
        '황금빛 에펠탑 야경 감성 여행 후기',
        '파리 여행 필수 코스, 에펠탑부터 골목 카페까지',
        '에펠탑 야경 베스트 포토 스팟 & 주변 맛집',
        '처음 가는 파리 여행자를 위한 에펠탑 완벽 가이드'
      ],
      seoKeywords: ['파리여행', '에펠탑야경', '프랑스감성', '유럽자유여행', '파리카페', '에펠탑포토스팟', '파리골목', '파리감성사진', '유럽여행코스', '파리여행팁']
    };
  }

  // 오랑주리 카페 프리셋
  if (isOrangery) {
    return {
      title: '파리 식물원 카페 오랑주리, 초록빛 온실에서 보낸 오후',
      body: `<h2>초록빛 식물로 가득한 유리 온실의 매력</h2>
<p>파리 한 복판에 자리한 <strong>오랑주리 카페</strong>는 도심 속 자연의 숨결을 느낄 수 있는 특별한 공간입니다. 유리 온실 구조로 된 공간에서 커피를 마시며 바라보는 풍경은 일상을 잊게 만듭니다.</p>

<h2>온실 카페 이용 정보 & 추천 메뉴</h2>
<p>자연스러운 채광과 초록빛 식물들이 어우러진 공간에서 오후 한 시간을 보내는 것만으로도 충분한 힐링이 됩니다.</p>
<ul>
  <li><strong>영업시간:</strong> 오전 10시 ~ 저녁 7시</li>
  <li><strong>추천 메뉴:</strong> 레몬타르트 + 라떼</li>
</ul>
${faqBlock ? `<h3>★ 오랑주리 카페 FAQ</h3>
<ul>
  <li><strong>Q1. 예약이 필요한가요?</strong><br>A: 주말에는 대기가 있을 수 있어 오전 방문을 추천합니다.</li>
  <li><strong>Q2. 사진 촬영이 자유롭나요?</strong><br>A: 네, 개인 촬영은 자유롭게 가능합니다.</li>
  <li><strong>Q3. 영어 메뉴판이 있나요?</strong><br>A: 영어 메뉴판이 따로 있어 주문이 어렵지 않습니다.</li>
</ul>` : ''}`,
      seoTitles: [
        '파리 온실 카페 오랑주리 다녀온 후기',
        '파리 식물원 카페, 초록빛 감성 충전 공간',
        '오랑주리 카페 위치, 메뉴, 이용 팁 총정리',
        '파리 숨은 명소 유리 온실 카페 추천',
        '인스타 감성 파리 카페 탐방기 - 오랑주리'
      ],
      seoKeywords: ['파리오랑주리', '식물원카페', '파리여행', '온실카페', '파리감성카페', '유럽카페투어', '파리핫플', '파리숨은명소', '파리인스타', '파리카페추천']
    };
  }

  // 사용자 직접 입력 기반 (일반 케이스)
  return PB.generateGenericDemoContent();
};

PB.generateGenericDemoContent = function () {
  const subject  = PB.inputSubject.value.trim() || '오늘의 방문지';
  const desc     = PB.inputDesc.value.trim();
  const dateStr  = PB.inputDate.value ? PB.inputDate.value.replace(/-/g, '. ') : '최근';
  const kwText   = PB.keywordsList.length > 0 ? PB.keywordsList.join(', ') : subject;
  const faq      = PB.chkFaq.checked;
  const catMap   = {
    restaurant:'맛집/푸드', cafe:'카페/디저트', travel:'여행/관광',
    tech:'IT/테크/가전', fashion:'패션/뷰티', living:'리빙/인테리어',
    parenting:'육아/교육', review:'도서/영화/리뷰', health:'건강/운동/헬스',
    finance:'경제/재테크/비즈', news:'시사/경제/정치'
  };
  const catName  = catMap[PB.currentCategory] || '일반';

  const title = `[${catName}] ${subject} 직접 경험한 솔직 후기`;
  const body  = `<h2>${subject} 방문 후기 — ${dateStr}</h2>
<p>${desc ? desc : `${dateStr}에 직접 방문하여 경험한 ${subject}의 솔직한 리뷰를 공유합니다.`}</p>

<h2>핵심 포인트 정리</h2>
<ul>
  <li><strong>카테고리:</strong> ${catName}</li>
  <li><strong>방문일:</strong> ${dateStr}</li>
  <li><strong>핵심 키워드:</strong> ${kwText}</li>
</ul>

<p>실제로 방문해서 느낀 분위기와 세부 사항들을 담아봤습니다. API 키를 입력하면 Gemini AI가 사진을 분석해 훨씬 더 풍부한 글을 자동으로 작성해줍니다.</p>
${faq ? `<h3>★ ${subject} FAQ</h3>
<ul>
  <li><strong>Q1. 어떤 분들에게 추천하나요?</strong><br>A: ${catName} 분야에 관심있는 모든 분들에게 추천합니다.</li>
  <li><strong>Q2. 다시 방문할 의향이 있나요?</strong><br>A: 네, 충분히 재방문 가치가 있습니다.</li>
</ul>` : ''}`;

  return {
    title,
    body,
    seoTitles: [
      title,
      `${subject} 솔직 후기 & 방문 가이드`,
      `${catName} 추천: ${subject} 총정리`,
      `알고 가면 더 좋은 ${subject} 핵심 정보`,
      `${subject} 방문 전 꼭 알아야 할 것들`
    ],
    seoKeywords: ['감성블로그', '데이트추천', '낭만여행', '분위기맛집', '사진찍기좋은곳', '핫플투어', '인생샷명소', '요즘후기', '내돈내산', '트렌드탐방']
  };
};
