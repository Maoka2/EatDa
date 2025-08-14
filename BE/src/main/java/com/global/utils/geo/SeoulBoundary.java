package com.global.utils.geo;

public class SeoulBoundary {
    public static final double MAX_LATITUDE = 37.80;
    public static final double MIN_LATITUDE = 37.40;
    public static final double MAX_LONGITUDE = 127.30;
    public static final double MIN_LONGITUDE = 126.60;

    public static boolean inSeoul(double latitude, double longitude) {
        return latitude >= MIN_LATITUDE && latitude <= MAX_LATITUDE &&
                longitude >= MIN_LONGITUDE && longitude <= MAX_LONGITUDE;
    }
}
