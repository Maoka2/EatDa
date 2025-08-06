package com.global.config;

import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "filestore")
@Getter
public class FileStorageProperties {
    private String imageRoot;
    private String videoRoot;
}
