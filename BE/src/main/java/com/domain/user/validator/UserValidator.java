package com.domain.user.validator;

import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import java.util.Objects;
import org.springframework.web.multipart.MultipartFile;

public class UserValidator {

    // 이메일 정규식: abc@domain.com 형식
    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";

    // 최소 비밀번호 길이
    private static final int PASSWORD_MIN_LENGTH = 8;

    // @formatter:off
    /**
     * 이메일이 null이거나 공백이면 예외 발생
     * 이메일 형식이 올바르지 않으면 예외 발생
     */
    // @formatter:on
    public static void validateEmail(String email) {
        if (Objects.isNull(email) || email.isBlank()) {
            throw new ApiException(ErrorCode.EMAIL_REQUIRED, email);
        }
        if (!email.matches(EMAIL_REGEX)) {
            throw new ApiException(ErrorCode.EMAIL_INVALID_FORMAT, email);
        }
    }

    public static void validatePassword(String password) {
        if (Objects.isNull(password) || password.isBlank()) {
            throw new ApiException(ErrorCode.PASSWORD_REQUIRED, password);
        }
        if (password.length() < PASSWORD_MIN_LENGTH) {
            throw new ApiException(ErrorCode.PASSWORD_TOO_SHORT, password);
        }
    }

    // @formatter:off
    /**
     * 비밀번호가 null이거나 공백이면 예외 발생
     * 비밀번호 확인이 null이거나 공백이면 예외 발생
     * 비밀번호와 확인 비밀번호가 일치하지 않으면 예외 발생
     * 비밀번호 길이가 너무 짧으면 예외 발생
     */
    // @formatter:on
    public static void validatePassword(String password, String confirmPassword) {
        if (Objects.isNull(password) || password.isBlank()) {
            throw new ApiException(ErrorCode.PASSWORD_REQUIRED, password);
        }
        if (password.length() < PASSWORD_MIN_LENGTH) {
            throw new ApiException(ErrorCode.PASSWORD_TOO_SHORT, password);
        }
        if (Objects.isNull(confirmPassword) || confirmPassword.isBlank()) {
            throw new ApiException(ErrorCode.CONFIRM_PASSWORD_REQUIRED, confirmPassword);
        }
        if (!password.equals(confirmPassword)) {
            throw new ApiException(ErrorCode.CONFIRM_PASSWORD_MISMATCH, confirmPassword);
        }
    }

    /**
     * 닉네임이 null이거나 공백이면 예외 발생
     */
    public static void validateNickname(String nickname) {
        if (Objects.isNull(nickname) || nickname.isBlank()) {
            throw new ApiException(ErrorCode.NICKNAME_REQUIRED, nickname);
        }
    }

    /**
     * 주소가 null이거나 공백이면 예외 발생
     */
    public static void validateAddress(String address) {
        if (Objects.isNull(address) || address.isBlank()) {
            throw new ApiException(ErrorCode.ADDRESS_REQUIRED, address);
        }
    }

    public static void validateLicenseImage(MultipartFile licenseImage) {
        if (Objects.isNull(licenseImage) || licenseImage.isEmpty()) {
        }
    }
}
