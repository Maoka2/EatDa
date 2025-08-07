package com.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "filestorage")
@Getter
@Setter
public class FileStorageProperties {
    private String imageRoot;
    private String videoRoot;
}
