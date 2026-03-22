package com.hospital.api_gateway.scheduler;
import com.hospital.api_gateway.config.RateLimitInterceptor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RateLimitScheduler {

    private final RateLimitInterceptor interceptor;

    public RateLimitScheduler(RateLimitInterceptor interceptor) {
        this.interceptor = interceptor;
    }

    @Scheduled(fixedRate = 60000)
    public void reset() {
        interceptor.resetCounts();
    }
}
