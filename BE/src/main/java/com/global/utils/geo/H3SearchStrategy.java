package com.global.utils.geo;

public class H3SearchStrategy {
    /**
     * 거리에 따른 H3 검색 전략 결정
     *
     * @param distanceMeters 검색 거리 (미터)
     * @return H3 검색 전략 (해상도, k-ring 값)
     */
    public static Strategy determineStrategy(int distanceMeters) {
        if (distanceMeters <= 300) {
            // Res 10: 75.9m, k=4: 75.9m × 4 = 303.6m (300m 커버)
            return new Strategy(10, 4);
        } else if (distanceMeters <= 500) {
            // Res 9: 201m, k=3: 201m × 3 = 603m (500m 충분히 커버)
            return new Strategy(9, 3);
        } else if (distanceMeters <= 700) {
            // Res 9: 201m, k=4: 201m × 4 = 804m (700m 충분히 커버)
            return new Strategy(9, 4);
        } else if (distanceMeters <= 1000) {
            // Res 8: 531m, k=3: 531m × 3 = 1593m (1000m 충분히 커버)
            return new Strategy(8, 3);
        } else {
            // Res 7: 1406m, k=2: 1406m × 2 = 2812m (2000m 충분히 커버)
            return new Strategy(7, 2);
        }
    }

    public record Strategy(int resolution, int kRing) {}
}
