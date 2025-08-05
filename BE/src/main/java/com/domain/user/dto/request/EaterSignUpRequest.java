package com.domain.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record EaterSignUpRequest(

        @NotBlank(message = "EMAIL_REQUIRED")
        @Email(message = "EMAIL_INVALID_FORMAT")
        @Schema(description = "이메일 주소", example = "eater@example.com")
        String email,

        @NotBlank(message = "PASSWORD_REQUIRED")
        @Size(min = 8, message = "PASSWORD_TOO_SHORT")
        @Schema(description = "비밀번호", example = "Abcdefg1!")
        String password,

        @NotBlank(message = "PASSWORD_CONFIRM_REQUIRED")
        @Schema(description = "비밀번호 확인", example = "Abcdefg1!")
        String passwordConfirm,

        @NotBlank(message = "NICKNAME_REQUIRED")
        @Schema(description = "닉네임", example = "우갸갹!")
        String nickname,

        @Schema(description = "선호 음식", example = "[1, 4, 9]")
        List<Integer> foodTagIds,

        @Size(max = 50, message = "CUSTOM_FOOD_TAG_TOO_LONG")
        @Schema(description = "사용자 정의 선호 음식", example = "마라탕")
        String customFoodTag
) {
}
