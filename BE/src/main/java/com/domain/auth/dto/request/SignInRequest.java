package com.domain.auth.dto.request;

import com.domain.user.constants.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignInRequest(

        @NotBlank(message = "EMAIL_REQUIRED")
        @Email(message = "EMAIL_INVALID_FORMAT")
        @Schema(description = "이메일 주소", example = "eater@example.com")
        String email,

        @NotBlank(message = "PASSWORD_REQUIRED")
        @Size(min = 8, message = "PASSWORD_TOO_SHORT")
        @Schema(description = "비밀번호", example = "Abcdefg1!")
        String password,

        @Schema(description = "역할", example = "EATER")
        Role role
) {
    public boolean isEater() {
        return Role.EATER.equals(this.role);
    }

    public boolean isMaker() {
        return Role.MAKER.equals(this.role);
    }
}
