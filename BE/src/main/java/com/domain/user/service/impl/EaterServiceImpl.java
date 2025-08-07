package com.domain.user.service.impl;

import com.domain.user.dto.request.EaterCheckEmailRequest;
import com.domain.user.dto.request.EaterCheckNicknameRequest;
import com.domain.user.dto.request.EaterSignUpRequest;
import com.domain.user.entity.User;
import com.domain.user.mapper.EaterMapper;
import com.domain.user.repository.EaterRepository;
import com.domain.user.service.EaterService;
import com.domain.user.validator.UserValidator;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EaterServiceImpl implements EaterService {

    private final EaterRepository eaterRepository;
    private final EaterMapper eaterMapper;

    /**
     * 냠냠이 회원가입을 처리
     *
     * @param request 회원가입 요청 정보
     * @return 저장된 사용자 엔티티
     */
    @Override
    public User registerEater(final EaterSignUpRequest request) {
        validateSignUpRequest(request);
        return eaterRepository.save(eaterMapper.toEntity(request));
    }

    /**
     * 냠냠이 회원가입 이메일 중복 확인
     *
     * @param request 이메일 중복 확인 요청 정보
     */
    @Override
    public void validateEmailAvailable(final EaterCheckEmailRequest request) {
        UserValidator.validateEmail(request.email());
        validateDuplicateEmail(request.email());
    }

    /**
     * 냠냠이 회원가입 닉네임 중복 확인
     *
     * @param request 닉네임 중복 확인 요청 정보
     */
    @Override
    public void validateNicknameAvailable(final EaterCheckNicknameRequest request) {
        UserValidator.validateNickname(request.nickname());
        validateDuplicateNickname(request.nickname());
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
    private void validateSignUpRequest(final EaterSignUpRequest request) {
        UserValidator.validateEmail(request.email());
        UserValidator.validatePassword(request.password(), request.passwordConfirm());
        UserValidator.validateNickname(request.nickname());

        validateDuplicateEmail(request.email());
        validateDuplicateNickname(request.nickname());
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
        if (eaterRepository.existsByEmail(email)) {
            throw new ApiException(ErrorCode.EMAIL_DUPLICATED, email);
        }
    }

    // @formatter:off
    /**
     * 닉네임 중복 여부를 검사
     * 중복일 경우 ApiException을 발생
     *
     * @param nickname 중복 확인할 닉네임
     */
    // @formatter:on
    private void validateDuplicateNickname(final String nickname) {
        if (eaterRepository.existsByNickname(nickname)) {
            throw new ApiException(ErrorCode.NICKNAME_DUPLICATED, nickname);
        }
    }
}
