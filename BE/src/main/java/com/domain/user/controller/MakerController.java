package com.domain.user.controller;

import com.domain.user.dto.request.MakerCheckEmailRequest;
import com.domain.user.dto.request.MakerSignUpBaseRequest;
import com.domain.user.dto.request.MakerSignUpMenuRequest;
import com.domain.user.entity.User;
import com.domain.user.mapper.MakerMapper;
import com.domain.user.service.MakerService;
import com.global.constants.SuccessCode;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/makers")
@RequiredArgsConstructor
public class MakerController {

    private final MakerService makerService;
    private final MakerMapper makerMapper;

    @Operation(
            summary = "Maker 회원가입",
            description = "Maker의 회원가입을 진행합니다."
    )
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse> signup(
            @Validated @RequestPart("base") MakerSignUpBaseRequest baseRequest,
            @Validated @RequestPart(value = "menus", required = false) List<MakerSignUpMenuRequest> menuRequests,
            @RequestPart(value = "license", required = false) MultipartFile licenseImageRequest,
            @RequestPart(value = "images", required = false) List<MultipartFile> menuImageRequests) {
        User maker = makerService.registerMaker(baseRequest, menuRequests, licenseImageRequest, menuImageRequests);
        return ApiResponseFactory.success(SuccessCode.MAKER_SIGNUP, makerMapper.toResponse(maker, maker.getStores()
                .getFirst()));
    }

    @Operation(
            summary = "Eater 회원가입 - 이메일 중복 확인",
            description = "Eater의 회원가입을 진행합니다."
    )
    @PostMapping("/check-email")
    public ResponseEntity<BaseResponse> checkEmail(@Validated @RequestBody final MakerCheckEmailRequest request) {
        makerService.validateEmailAvailable(request);
        return ApiResponseFactory.success(SuccessCode.EMAIL_AVAILABLE);
    }
}
