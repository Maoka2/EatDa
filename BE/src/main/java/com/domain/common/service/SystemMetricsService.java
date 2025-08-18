package com.domain.common.service;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SystemMetricsService {

    private final MeterRegistry meterRegistry;

    public double getCpuUsage() {
        Gauge cpuGauge = meterRegistry.find("system.cpu.usage").gauge();
        if (cpuGauge == null) return .0;

        return cpuGauge.value();
    }

    public double getMemoryUsage() {
        Gauge memoryGauge = meterRegistry.find("jvm.memory.used").gauge();
        Gauge maxMemoryGauge = meterRegistry.find("jvm.memory.max").gauge();

        if (memoryGauge == null || maxMemoryGauge == null) return .0;

        return memoryGauge.value() / maxMemoryGauge.value();
    }
}
