// 길찾기 페이지용 더미데이터
// src/data/findWayData.ts

export type SubPath = {
  type: 1 | 2 | 3;
  startName: string | null;
  endName: string | null;
  distance: number;
  time: number;
  subwayName: string | null;
  subwayColor: string | null;
  busNum: string | null;
  busColor: string | null;
};

export type PublicRoute = {
  price: number;
  totalTime: number;
  totalDistance: number;
  totalWalkTime: number;
  subPaths: SubPath[];
};

export const FindWayData: PublicRoute[] = [
  {
    price: 1250,
    totalTime: 42,
    totalDistance: 13200,
    totalWalkTime: 8,
    subPaths: [
      {
        type: 1,
        startName: "역삼역",
        endName: "강남역",
        distance: 800,
        time: 12,
        subwayName: "2호선",
        subwayColor: "#00B140",
        busNum: null,
        busColor: null,
      },
      {
        type: 3,
        startName: null,
        endName: null,
        distance: 100,
        time: 10,
        subwayName: null,
        subwayColor: null,
        busNum: null,
        busColor: null,
      },
    ],
  },
  {
    price: 1250,
    totalTime: 35,
    totalDistance: 8500,
    totalWalkTime: 5,
    subPaths: [
      {
        type: 3,
        startName: null,
        endName: null,
        distance: 500,
        time: 5,
        subwayName: null,
        subwayColor: null,
        busNum: null,
        busColor: null,
      },
      {
        type: 2,
        startName: "서울역버스환승센터",
        endName: "강남역12번출구",
        distance: 8000,
        time: 30,
        subwayName: null,
        subwayColor: null,
        busNum: "140",
        busColor: "#3B80EF",
      },
    ],
  },
  {
    price: 0,
    totalTime: 12,
    totalDistance: 700,
    totalWalkTime: 12,
    subPaths: [
      {
        type: 3,
        startName: null,
        endName: null,
        distance: 700,
        time: 12,
        subwayName: null,
        subwayColor: null,
        busNum: null,
        busColor: null,
      },
    ],
  },
];
