package com.domain.user.service.impl;

import com.domain.menu.entity.Menu;
import com.domain.menu.mapper.MenuMapper;
import com.domain.menu.repository.MenuRepository;
import com.global.utils.geo.H3Utils;
import com.domain.store.entity.Store;
import com.domain.store.mapper.StoreMapper;
import com.domain.store.repository.StoreRepository;
import com.domain.user.dto.request.MakerCheckEmailRequest;
import com.domain.user.dto.request.MakerSignUpBaseRequest;
import com.domain.user.dto.request.MakerSignUpMenuRequest;
import com.domain.user.entity.User;
import com.domain.user.mapper.MakerMapper;
import com.domain.user.repository.MakerRepository;
import com.domain.user.service.MakerService;
import com.domain.user.validator.UserValidator;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import com.global.filestorage.FileStorageService;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class MakerServiceImpl implements MakerService {

    private final FileStorageService fileStorageService;
    private final MakerRepository makerRepository;
    private final StoreRepository storeRepository;
    private final MenuRepository menuRepository;

    private final H3Utils h3Service;

    private final MakerMapper makerMapper;
    private final StoreMapper storeMapper;
    private final MenuMapper menuMapper;

    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public User registerMaker(final MakerSignUpBaseRequest baseRequest,
                              final List<MakerSignUpMenuRequest> menuRequests,
                              final MultipartFile licenseImageRequest,
                              final List<MultipartFile> menuImageRequests) {

        log.info("===== [Service] registerMaker START =====");
        log.info("BaseRequest: {}", baseRequest);
        log.info("menuRequests size: {}", menuRequests != null ? menuRequests.size() : 0);
        log.info("menuImageRequests size: {}", menuImageRequests != null ? menuImageRequests.size() : 0);

        validateSignUpRequest(baseRequest, menuRequests, licenseImageRequest, menuImageRequests);
        log.info("Step1: Validation complete");

        User maker = makerMapper.toEntity(baseRequest, passwordEncoder.encode(baseRequest.password()));
        log.info("Step2: Maker entity mapped");

        long h3Index7 = h3Service.encode(baseRequest.latitude(), baseRequest.longitude(), 7);
        log.info("Step3: h3Index7={}", h3Index7);

        Store store = storeMapper.toEntity(baseRequest, maker,
                storeImage(licenseImageRequest, "licenses/" + maker.getEmail()),
                h3Index7,
                h3Service.encode(baseRequest.latitude(), baseRequest.longitude(), 8),
                h3Service.encode(baseRequest.latitude(), baseRequest.longitude(), 9),
                h3Service.encode(baseRequest.latitude(), baseRequest.longitude(), 10)
        );
        log.info("Step4: Store entity mapped");

        List<Menu> menus = new ArrayList<>();
        for (int i = 0; i < menuRequests.size(); i++) {
            log.info("Step5: Processing menu index {}", i);
            MultipartFile imageRequest = menuImageRequests.get(i);
            menus.add(menuMapper.toEntity(menuRequests.get(i), store,
                    storeImage(imageRequest, "menus/" + maker.getEmail())));
        }
        log.info("Step6: Menu list created, size={}", menus.size());

        maker.addStore(store);
        log.info("Step7: Store added to Maker");

        makerRepository.save(maker);
        storeRepository.save(store);
        menuRepository.saveAll(menus);
        log.info("Step8: All entities saved");

        log.info("===== [Service] registerMaker END =====");
        return maker;
    }

    @Override
    public void validateEmailAvailable(final MakerCheckEmailRequest request) {
        UserValidator.validateEmail(request.email());
        validateDuplicateEmail(request.email());
    }

    private String storeImage(MultipartFile imageRequest, String path) {
        return fileStorageService.storeImage(imageRequest, path, imageRequest.getOriginalFilename());
    }

    // @formatter:off
    /**
     * 회원가입 요청에 대한 유효성 검사를 수행
     *
     * - 이메일 형식 및 중복 확인
     * - 비밀번호 유효성 및 일치 확인
     * - 닉네임 형식 및 중복 확인
     *
     * @param request 회원가입 요청 정보
     */
    // @formatter:on
    private void validateSignUpRequest(final MakerSignUpBaseRequest request,
                                       final List<MakerSignUpMenuRequest> menuRequests,
                                       final MultipartFile licenseImageRequest,
                                       final List<MultipartFile> imageRequests) {
        UserValidator.validateEmail(request.email());
        UserValidator.validateConfirmPassword(request.password(), request.passwordConfirm());

        UserValidator.validateLicenseImage(licenseImageRequest);
        validateDuplicateEmail(request.email());
    }

    // @formatter:off
    /**
     * 이메일 중복 여부를 검사
     * 중복일 경우 ApiException을 발생
     *
     * @param email 중복 확인할 이메일
     */
    // @formatter:on
    private void validateDuplicateEmail(final String email) {
        if (makerRepository.existsByEmail(email)) {
            throw new ApiException(ErrorCode.EMAIL_DUPLICATED, email);
        }
    }
}
