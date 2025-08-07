package com.domain.user.controller;

import com.domain.user.dto.request.MakerSignUpBaseRequest;
import com.domain.user.dto.request.MakerSignUpMenuRequest;
import com.domain.user.entity.User;
import com.domain.user.mapper.MakerMapper;
import com.domain.user.service.MakerService;
import com.global.constants.SuccessCode;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
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
    @PostMapping(value = "/", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse> signup(
            @Valid @RequestPart("base") MakerSignUpBaseRequest baseRequest,
            @Valid @RequestPart(value = "menus", required = false) List<MakerSignUpMenuRequest> menuRequests,
            @RequestPart(value = "license", required = false) MultipartFile licenseImageRequest,
            @RequestPart(value = "images", required = false) List<MultipartFile> menuImageRequests) {
        User maker = makerService.registerMaker(baseRequest, menuRequests, licenseImageRequest, menuImageRequests);
        return ApiResponseFactory.success(SuccessCode.MAKER_SIGNUP, makerMapper.toResponse(maker));
    }
}
