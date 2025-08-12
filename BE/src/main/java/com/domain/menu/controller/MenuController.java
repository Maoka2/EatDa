package com.domain.menu.controller;

import com.domain.menu.mapper.MenuMapper;
import com.domain.menu.service.MenuService;
import com.global.constants.SuccessCode;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuService menuService;
    private final MenuMapper menuMapper;

    @GetMapping
    public ResponseEntity<BaseResponse> getMenuList(@RequestParam("storeId") Long storeId) {
        return ApiResponseFactory.success(SuccessCode.MENU_GET,
                menuMapper.toResponse(menuService.getMenuList(storeId)));
    }
}
