package com.domain.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MakerSignUpBaseRequest(

        @NotBlank(message = "EMAIL_REQUIRED")
        @Email(message = "EMAIL_INVALID_FORMAT")
        @Schema(description = "이메일 주소", example = "makers@example.com")
        String email,

        @NotBlank(message = "PASSWORD_REQUIRED")
        @Size(min = 8, message = "PASSWORD_TOO_SHORT")
        @Schema(description = "비밀번호", example = "Abcdefg1!")
        String password,

        @NotBlank(message = "PASSWORD_CONFIRM_REQUIRED")
        @Schema(description = "비밀번호 확인", example = "Abcdefg1!")
        String passwordConfirm,

        @NotBlank(message = "STORE_NAME_REQUIRED")
        @Schema(description = "가게명", example = "우갸분식")
        String name,

        @NotBlank(message = "ADDRESS_REQUIRED")
        @Schema(description = "가게주소", example = "서울 마포구 양화로 12길 34")
        String address
) {
}
