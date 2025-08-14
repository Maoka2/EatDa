package com.domain.user.controller;

import com.domain.user.dto.request.EaterCheckEmailRequest;
import com.domain.user.dto.request.EaterCheckNicknameRequest;
import com.domain.user.dto.request.EaterSignUpRequest;
import com.domain.user.entity.User;
import com.domain.user.mapper.EaterMapper;
import com.domain.user.service.EaterService;
import com.global.constants.SuccessCode;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/eaters")
@RequiredArgsConstructor
public class EaterController {

    private final EaterService eaterService;
    private final EaterMapper eaterMapper;

    @Operation(
            summary = "Eater 회원가입",
            description = "Eater의 회원가입을 진행합니다."
    )
    @PostMapping
    public ResponseEntity<BaseResponse> signUp(@Validated @RequestBody final EaterSignUpRequest request) {
        User eater = eaterService.registerEater(request);
        return ApiResponseFactory.success(SuccessCode.EATER_SIGNUP, eaterMapper.toResponse(eater));
    }

    @Operation(
            summary = "Eater 회원가입 - 이메일 중복 확인",
            description = "Eater의 회원가입을 진행합니다."
    )
    @PostMapping("/check-email")
    public ResponseEntity<BaseResponse> checkEmail(@Validated @RequestBody final EaterCheckEmailRequest request) {
        eaterService.validateEmailAvailable(request);
        return ApiResponseFactory.success(SuccessCode.EMAIL_AVAILABLE);
    }

    @Operation(
            summary = "Eater 회원가입 - 닉네임 중복 확인",
            description = "Eater의 회원가입을 진행합니다."
    )
    @PostMapping("/check-nickname")
    public ResponseEntity<BaseResponse> checkNickname(@Validated @RequestBody final EaterCheckNicknameRequest request) {
        eaterService.validateNicknameAvailable(request);
        return ApiResponseFactory.success(SuccessCode.NICKNAME_AVAILABLE);
    }

    @GetMapping("/me")
    public ResponseEntity<BaseResponse> getProfile(@AuthenticationPrincipal String email) {
        return ApiResponseFactory.success(SuccessCode.PROFILE_GET,
                eaterMapper.toResponse(
                        eaterService.countMyReviews(email),
                        eaterService.countMyScrapReviews(email),
                        eaterService.countMyMenuPosters(email)
                ));
    }
}
