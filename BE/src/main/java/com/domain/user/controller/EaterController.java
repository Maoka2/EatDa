package com.domain.user.controller;

import com.domain.user.dto.request.EaterSignUpRequest;
import com.domain.user.entity.User;
import com.domain.user.mapper.EaterMapper;
import com.domain.user.service.EaterService;
import com.global.constants.SuccessCode;
import com.global.dto.response.BaseResponse;
import com.global.dto.response.SuccessResponse;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/eater")
@RequiredArgsConstructor
public class EaterController {

    private final EaterService eaterService;
    private final EaterMapper eaterMapper;

    @Operation(
            summary = "Eater 회원가입",
            description = "Eater의 회원가입을 진행합니다."
    )
    @PostMapping("/")
    public BaseResponse signUp(@RequestBody EaterSignUpRequest request) {
        User user = eaterService.registerEater(request);
        return SuccessResponse.of(SuccessCode.EATERS_SIGNUP, eaterMapper.toResponse(user));
    }
}
