package com.domain.auth.service.Impl;

import com.domain.auth.dto.request.SignInRequest;
import com.domain.auth.dto.request.SignOutRequest;
import com.domain.auth.dto.request.TokenRequest;
import com.domain.auth.jwt.Jwt;
import com.domain.auth.jwt.JwtProvider;
import com.domain.auth.jwt.JwtUtils;
import com.domain.auth.repository.AuthRepository;
import com.domain.auth.service.AuthService;
import com.domain.user.constants.Role;
import com.domain.user.entity.User;
import com.domain.user.repository.EaterRepository;
import com.domain.user.repository.MakerRepository;
import com.domain.user.validator.UserValidator;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final MakerRepository makerRepository;
    private final EaterRepository eaterRepository;
    private final AuthRepository authRepository;

    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final JwtUtils jwtUtils;

    @Override
    public Jwt signIn(final SignInRequest request) {

        User user = findUserByEmail(request.role(), request.email());
        validateSignInPassword(request.password(), user.getPassword());

        Jwt tokens = jwtProvider.generateTokens(user);
        authRepository.saveToken(user.getEmail(), tokens.getRefreshToken());

        return tokens;
    }

    @Override
    public void signOut(final SignOutRequest request) {
        String email = jwtUtils.extractEmailFromToken(request.refreshToken());
        authRepository.deleteToken(email);
    }

    @Override
    public String reissueToken(final TokenRequest request) {
        Role role = jwtUtils.extractRoleFromToken(request.refreshToken());
        String email = jwtUtils.extractEmailFromToken(request.refreshToken());

        String storedRefreshToken = authRepository.getToken(email);
        validateRefreshToken(request.refreshToken(), storedRefreshToken);

        User user = findUserByEmail(role, email);
        return jwtProvider.generateAccessToken(user);
    }

    private void validateSignInPassword(final String rawPassword, final String encodedPassword) {
        UserValidator.validatePassword(rawPassword);
        if (!passwordEncoder.matches(rawPassword, encodedPassword)) {
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    private User findUserByEmail(final Role role, final String email) {
        if (role.equals(Role.EATER)) {
            eaterRepository.findByEmailAndDeletedFalse(email)
                    .orElseThrow(() -> new ApiException(ErrorCode.INVALID_CREDENTIALS));
        }
        return makerRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_CREDENTIALS));
    }

    private void validateRefreshToken(final String refreshToken, final String storedRefreshToken) {
        if (Objects.isNull(refreshToken)) {
            throw new ApiException(ErrorCode.INVALID_TOKEN);
        }
        if (!storedRefreshToken.equals(refreshToken)) {
            throw new ApiException(ErrorCode.INVALID_TOKEN);
        }
    }
}
