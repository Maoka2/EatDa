package com.domain.menu.dto.request;

import com.global.annotation.ExcludeFromLogging;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public record MenuPosterAssetCreateRequest(
        @NotNull(message = "STORE_ID_REQUIRED")
        Long storeId,

        @NotBlank
        @Pattern(regexp = "IMAGE", message = "INVALID_ASSET_TYPE")
        String type,

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
