package com.domain.menu.dto.request;

import com.global.annotation.ExcludeFromLogging;
import com.global.constants.AssetType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public record MenuPosterAssetCreateRequest(
        @NotNull(message = "STORE_ID_REQUIRED")
        Long storeId,

        @NotBlank
        @Enumerated(EnumType.STRING)
        AssetType type,

        @NotEmpty(message = "MENU_IDS_REQUIRED")
        @ExcludeFromLogging
        List<@NotNull Long> menuIds,

        @NotBlank(message = "PROMPT_REQUIRED")
        String prompt,

        @NotEmpty(message = "IMAGES_REQUIRED")
        @ExcludeFromLogging
        List<@NotNull MultipartFile> image
) {
}
