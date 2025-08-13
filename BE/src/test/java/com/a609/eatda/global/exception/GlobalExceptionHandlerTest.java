package com.a609.eatda.global.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.global.constants.ErrorCode;
import com.global.dto.response.BaseResponse;
import com.global.dto.response.ErrorResponse;
import com.global.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;

public class GlobalExceptionHandlerTest {

    @Test
    void 유효성_에러_메시지가_ErrorCode에_존재하면_매핑되어야_한다() {
        // given
        BindingResult bindingResult = new BeanPropertyBindingResult(new Dummy(), "dummy");
        bindingResult.rejectValue("email", "", "EMAIL_REQUIRED"); // ErrorCode name 사용

        MethodArgumentNotValidException exception =
                new MethodArgumentNotValidException(null, bindingResult);

        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        // when
        ResponseEntity<BaseResponse> response = handler.handleValidationException(exception);

        // then
        assertThat(response.getStatusCode().value()).isEqualTo(400);

        ErrorResponse body = (ErrorResponse) response.getBody();

        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("VALIDATION_ERROR");
        assertThat(body.data())
                .asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.MAP)
                .containsEntry("email", ErrorCode.EMAIL_REQUIRED.getMessage());
    }

    @Test
    void 유효성_에러_메시지가_ErrorCode에_존재하지_않는다면_매핑되지_않는다() {
        // given
        BindingResult bindingResult = new BeanPropertyBindingResult(new Dummy(), "dummy");
        bindingResult.rejectValue("email", "", "이메일은 입력해야 하는데요."); // ErrorCode name 사용

        MethodArgumentNotValidException exception =
                new MethodArgumentNotValidException(null, bindingResult);

        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        // when
        ResponseEntity<BaseResponse> response = handler.handleValidationException(exception);

        // then
        assertThat(response.getStatusCode().value()).isEqualTo(400);

        ErrorResponse body = (ErrorResponse) response.getBody();

        assertThat(body).isNotNull();
        assertThat(body.code()).isEqualTo("VALIDATION_ERROR");
        assertThat(body.data())
                .asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.MAP)
                .containsEntry("email", "이메일은 입력해야 하는데요.");
    }

    static class Dummy {
        private String email;

        public String getEmail() {
            return email;
        }
    }
}
