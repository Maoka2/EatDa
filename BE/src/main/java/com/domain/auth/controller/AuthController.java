package com.domain.auth.controller;

import com.domain.auth.dto.request.SignInRequest;
import com.domain.auth.dto.request.SignOutRequest;
import com.domain.auth.dto.request.TokenRequest;
import com.domain.auth.jwt.Jwt;
import com.domain.auth.mapper.AuthMapper;
import com.domain.auth.service.AuthService;
import com.global.constants.SuccessCode;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthMapper authMapper;

    @Operation(
            summary = "로그인",
            description = "Eater/Maker의 회원가입을 진행합니다."
    )
    @PostMapping("/sign-in")
    public ResponseEntity<BaseResponse> signIn(@Validated @RequestBody final SignInRequest request) {
        Jwt jwt = authService.signIn(request);
        return ApiResponseFactory.success(SuccessCode.SIGN_IN_SUCCESS, authMapper.toResponse(jwt));
    }

    @Operation(
            summary = "로그아웃",
            description = "Eater/Maker의 회원가입을 진행합니다."
    )
    @PostMapping("/sign-out")
    public ResponseEntity<BaseResponse> signOut(@Validated @RequestBody final SignOutRequest request) {
        authService.signOut(request);
        return ApiResponseFactory.success(SuccessCode.SIGN_OUT_SUCCESS);
    }

    @Operation(
            summary = "AccessToken 재발급",
            description = "AccessToken이 만료가 되었을 경우, RefreshToken을 이용하여 AccessToken을 재발급 받습니다."
    )
    @PostMapping("/token")
    public ResponseEntity<BaseResponse> reissueToken(@Validated @RequestBody final TokenRequest request) {
        String accessToken = authService.reissueToken(request);
        return ApiResponseFactory.success(SuccessCode.TOKEN_REFRESHED, authMapper.toResponse(accessToken));
    }
}
