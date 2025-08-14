package com.global.utils.geo;

import com.uber.h3core.H3Core;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class H3Utils {
    private final H3Core h3;

    public H3Utils() throws IOException {
        this.h3 = H3Core.newInstance();
    }

    public long encode(double lat, double lon, int resolution) {
        return h3.latLngToCell(lat, lon, resolution);
    }

    public List<Long> getKRing(long h3Index, int k) {
        return h3.gridDisk(h3Index, k);
    }

    public int getResolution(long h3Index) {
        return h3.getResolution(h3Index);
    }

    public boolean isValid(long h3Index) {
        return h3.isValidCell(h3Index);
    }
}
