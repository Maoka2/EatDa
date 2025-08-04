// 메뉴판 더미 데이터 저장소

interface menuItem {
  id: string;
  menuName: string;
  menuDescription: string;
  uri?: string;
  // storeId?: string;
}

export const menuData: menuItem[] = [
  {
    id: "1",
    menuName: "토마토 콤비네이션 피자",
    menuDescription: "몸에 좋은 토마토가 듬뿍 들어간 건강 피자입니다.",
    uri: "https://picsum.photos/200/200?random=1",
  },
  {
    id: "2",
    menuName: "베이컨 치즈 피자",
    menuDescription: "고소한 베이컨과 치즈가 어우러진 풍미 가득한 피자.",
    uri: "https://picsum.photos/200/200?random=2",
  },
  {
    id: "3",
    menuName: "고르곤졸라 피자",
    menuDescription: "꿀과 함께 즐기는 달콤짭짤한 고르곤졸라 피자.",
    uri: "https://picsum.photos/200/200?random=3",
  },
  {
    id: "4",
    menuName: "페퍼로니 피자",
    menuDescription: "매콤한 페퍼로니가 듬뿍 올라간 인기 메뉴.",
    uri: "https://picsum.photos/200/200?random=4",
  },
  {
    id: "5",
    menuName: "불고기 피자",
    menuDescription: "한국인의 입맛을 사로잡는 달콤한 불고기 토핑.",
    uri: "https://picsum.photos/200/200?random=5",
  },
  {
    id: "6",
    menuName: "하와이안 피자",
    menuDescription: "파인애플의 달콤함과 햄의 조화가 일품.",
    uri: "https://picsum.photos/200/200?random=6",
  },
  {
    id: "7",
    menuName: "민트초코 피자",
    menuDescription: "오...",
    uri: "https://picsum.photos/200/200?random=7",
  },
  {
    id: "8",
    menuName: "화이트 소스 파스타",
    menuDescription: "크리미한 소스와 베이컨이 어우러진 파스타.",
    uri: "https://picsum.photos/200/200?random=8",
  },
  {
    id: "9",
    menuName: "토마토 소스 파스타",
    menuDescription: "상큼한 토마토 소스가 매력적인 클래식 파스타.",
    uri: "https://picsum.photos/200/200?random=9",
  },
  {
    id: "10",
    menuName: "갈릭 브레드",
    menuDescription: "버터와 마늘향 가득한 부드러운 식전빵.",
    uri: "https://picsum.photos/200/200?random=10",
  },
];
