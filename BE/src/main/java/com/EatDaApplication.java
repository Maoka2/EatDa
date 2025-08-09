package com;

import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
@EnableBatchProcessing
@ConfigurationPropertiesScan(basePackages = "com")
public class EatDaApplication {

    public static void main(String[] args) {
        SpringApplication.run(EatDaApplication.class, args);
    }
}
