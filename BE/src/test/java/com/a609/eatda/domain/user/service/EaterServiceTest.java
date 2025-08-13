package com.a609.eatda.domain.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.domain.user.constants.Role;
import com.domain.user.dto.request.EaterSignUpRequest;
import com.domain.user.entity.User;
import com.domain.user.mapper.EaterMapper;
import com.domain.user.repository.EaterRepository;
import com.domain.user.service.impl.EaterServiceImpl;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
public class EaterServiceTest {

    @Mock
    private EaterRepository eaterRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EaterMapper eaterMapper;

    @InjectMocks
    private EaterServiceImpl eaterService;

    private EaterSignUpRequest createEaterSingUpRequest(String email, String password, String confirmPassword,
                                                        String nickname) {
        return new EaterSignUpRequest(email, password, confirmPassword, nickname);
    }

    private void assertRegisterEaterThrows(EaterSignUpRequest request, ErrorCode errorCode) {
        assertThatThrownBy(() -> eaterService.registerEater(request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining(errorCode.getMessage());
    }

    @Test
    void 회원가입_성공() {
        EaterSignUpRequest request = createEaterSingUpRequest("email@email.com", "password", "password", "nickname");

        given(passwordEncoder.encode("password")).willReturn("encodedPassword");

        User mockEncodedUser = User.builder()
                .email("email@email.com")
                .password("encodedPassword")
                .nickname("nickname")
                .role(Role.EATER)
                .build();

        given(eaterMapper.toEntity(request, "encodedPassword")).willReturn(mockEncodedUser);

        given(eaterRepository.save(mockEncodedUser)).willReturn(mockEncodedUser);

        User result = eaterService.registerEater(request);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("email@email.com");
        assertThat(result.getPassword()).isEqualTo("encodedPassword");
        assertThat(result.getNickname()).isEqualTo("nickname");
        assertThat(result.getRole()).isEqualTo(Role.EATER);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" "})
    void 회원가입_실패_이메일_누락(String invalidEmail) {
        EaterSignUpRequest request = createEaterSingUpRequest(invalidEmail, "password", "password", "nickname");
        assertRegisterEaterThrows(request, ErrorCode.EMAIL_REQUIRED);
    }

    @ParameterizedTest
    @ValueSource(strings = {"invalid", "no-at.com", "abc@com"})
    void 회원가입_실패_이메일_형식(String invalidEmail) {
        EaterSignUpRequest request = createEaterSingUpRequest(invalidEmail, "password", "password", "nickname");
        assertRegisterEaterThrows(request, ErrorCode.EMAIL_INVALID_FORMAT);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {""})
    void 회원가입_실패_비밀번호_누락(String invalidPassword) {
        EaterSignUpRequest request = createEaterSingUpRequest("email@email.com", invalidPassword, "password",
                "nickname");
        assertRegisterEaterThrows(request, ErrorCode.PASSWORD_REQUIRED);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {""})
    void 회원가입_실패_비밀번호_확인_누락(String invalidConfirmPassword) {
        EaterSignUpRequest request = createEaterSingUpRequest("email@email.com", "password", invalidConfirmPassword,
                "nickname");
        assertRegisterEaterThrows(request, ErrorCode.CONFIRM_PASSWORD_REQUIRED);
    }

    @Test
    void 회원가입_실패_비밀번호_불일치() {
        EaterSignUpRequest request = createEaterSingUpRequest("email@email.com", "password", "passw0rd", "nickname");
        assertRegisterEaterThrows(request, ErrorCode.CONFIRM_PASSWORD_MISMATCH);
    }

    @Test
    void 회원가입_실패_비밀번호_길이가_짧음() {
        EaterSignUpRequest request = createEaterSingUpRequest("email@email.com", "pw", "pw", "nickname");
        assertRegisterEaterThrows(request, ErrorCode.PASSWORD_TOO_SHORT);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void 회원가입_실패_닉네임_누락(String invalidNickname) {
        EaterSignUpRequest request = createEaterSingUpRequest("email@email.com", "password", "password",
                invalidNickname);
        assertRegisterEaterThrows(request, ErrorCode.NICKNAME_REQUIRED);
    }

    @Test
    void 회원가입_실패_이메일_중복() {
        EaterSignUpRequest request = createEaterSingUpRequest("email@email.com", "password", "password", "nickname");
        given(eaterRepository.existsByEmail("email@email.com")).willReturn(true);
        assertRegisterEaterThrows(request, ErrorCode.EMAIL_DUPLICATED);
    }

    @Test
    void 회원가입_실패_닉네임_중복() {
        EaterSignUpRequest request = createEaterSingUpRequest("email@email.com", "password", "password", "nickname");
        given(eaterRepository.existsByNickname("nickname")).willReturn(true);
        assertRegisterEaterThrows(request, ErrorCode.NICKNAME_DUPLICATED);
    }
}
