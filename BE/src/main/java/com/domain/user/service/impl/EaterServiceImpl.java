package com.domain.user.service.impl;

import com.domain.user.dto.request.EaterSignUpRequest;
import com.domain.user.entity.User;
import com.domain.user.mapper.EaterMapper;
import com.domain.user.repository.EaterRepository;
import com.domain.user.service.EaterService;
import com.domain.user.validator.UserValidator;
import com.global.constants.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EaterServiceImpl implements EaterService {

    private final EaterRepository eaterRepository;
    private final EaterMapper eaterMapper;

    @Override
    public User registerEater(final EaterSignUpRequest request) {
        UserValidator.validateEmail(request.email());
        UserValidator.validatePassword(request.password(), request.passwordConfirm());
        UserValidator.validateNickname(request.nickname());

        validateDuplicateEmail(request.email());
        validateDuplicateNickname(request.nickname());

        return eaterRepository.save(eaterMapper.toEntity(request));
    }

    private void validateDuplicateEmail(String email) {
        if (eaterRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(ErrorCode.EMAIL_DUPLICATED.getMessage());
        }
    }

    private void validateDuplicateNickname(String nickname) {
        if (eaterRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException(ErrorCode.NICKNAME_DUPLICATED.getMessage());
        }
    }
}
