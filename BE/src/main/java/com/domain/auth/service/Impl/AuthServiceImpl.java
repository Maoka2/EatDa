package com.domain.auth.service.Impl;

import com.domain.auth.dto.request.SignInRequest;
import com.domain.auth.jwt.Jwt;
import com.domain.auth.repository.AuthRepository;
import com.domain.auth.service.AuthService;
import com.domain.user.entity.User;
import com.domain.user.repository.EaterRepository;
import com.domain.user.repository.MakerRepository;
import com.domain.user.validator.UserValidator;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final MakerRepository makerRepository;
    private final EaterRepository eaterRepository;
    private final AuthRepository authRepository;

    @Override
    public Jwt signIn(SignInRequest request) {

        User user = findUserByEmail(request);
        
        UserValidator.validatePassword(request.password());

        return Jwt.builder().accessToken("accessToken").refreshToken("refreshToken").build();
    }

    @Override
    public void signOut() {
    }

    private User findUserByEmail(SignInRequest request) {
        if (request.isEater()) {
            eaterRepository.findByEmailAndDeletedFalse(request.email())
                    .orElseThrow(() -> new ApiException(ErrorCode.INVALID_CREDENTIALS));
        }
        return eaterRepository.findByEmailAndDeletedFalse(request.email())
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_CREDENTIALS));
    }
}
