package com.global.config.swagger;

import static com.global.constants.Messages.API_DESCRIPTION;
import static com.global.constants.Messages.API_TITLE;
import static com.global.constants.Messages.API_VERSION;
import static com.global.constants.Messages.BEARER_FORMAT;
import static com.global.constants.Messages.BEARER_SCHEME;
import static com.global.constants.Messages.LOCAL_SERVER_URL;
import static com.global.constants.Messages.PROD_SERVER_URL;
import static com.global.constants.Messages.SECURITY_SCHEME_NAME;
import static com.global.constants.Messages.TEST_SERVER_URL;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .components(createSecurityComponents())
                .security(List.of(createSecurityRequirement()))
                .servers(createServers())
                .info(createApiInfo());
    }

    // JWT 인증 관련 설정 생성
    private Components createSecurityComponents() {
        SecurityScheme scheme = createJwtSecurityScheme();
        return new Components().addSecuritySchemes(SECURITY_SCHEME_NAME.message(), scheme);
    }

    // JWT 보안 구성 설정 생성
    private SecurityScheme createJwtSecurityScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme(BEARER_SCHEME.message())
                .bearerFormat(BEARER_FORMAT.message());
    }

    // 보안 요구사항 설정
    private SecurityRequirement createSecurityRequirement() {
        return new SecurityRequirement().addList(SECURITY_SCHEME_NAME.message());
    }

    // API 정보 설정
    private Info createApiInfo() {
        return new Info()
                .title(API_TITLE.message())
                .description(API_DESCRIPTION.message())
                .version(API_VERSION.message());
    }

    // 서버 정보 설정
    private List<Server> createServers() {
        Server localServer = new Server().url(LOCAL_SERVER_URL.message());
        Server prodServer = new Server().url(PROD_SERVER_URL.message());
        Server testServer = new Server().url(TEST_SERVER_URL.message());
        return List.of(localServer, prodServer, testServer);
    }
}
