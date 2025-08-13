package com.domain.event.dto.request;

import com.global.annotation.ExcludeFromLogging;
import com.global.constants.AssetType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

import jakarta.validation.constraints.Pattern;
import org.springframework.web.multipart.MultipartFile;

public record EventAssetCreateRequest(

        @NotBlank(message = "EVENT_TITLE_REQUIRED")
        String title,

        @NotBlank
        @Pattern(regexp = "IMAGE", message = "INVALID_ASSET_TYPE")
        String type,

        @NotBlank(message = "EVENT_START_DATE_REQUIRED")
        String startDate,

        @NotBlank(message = "EVENT_END_DATE_REQUIRED")
        String endDate,

        @NotBlank(message = "PROMPT_REQUIRED")
        String prompt,

        @NotEmpty(message = "IMAGES_REQUIRED")
        @ExcludeFromLogging
        List<@NotNull MultipartFile> image
) {
}
