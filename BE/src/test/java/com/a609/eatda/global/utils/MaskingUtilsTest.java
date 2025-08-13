package com.a609.eatda.global.utils;

import static com.global.constants.Messages.LOG_ERROR_VALUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.global.annotation.ExcludeFromLogging;
import com.global.annotation.Sensitive;
import com.global.utils.MaskingUtils;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;

class MaskingUtilsTest {

    @Test
    void 민감_정보는_마스킹_처리된다() {
        TestUser user = new TestUser("testUser", "secretPassword");

        String masked = MaskingUtils.mask(user);

        assertThat(masked)
                .contains("name=testUser")
                .contains("password=****")
                .doesNotContain("secretPassword");
    }

    @Test
    void null_객체는_null_문자열을_반환한다() {
        assertThat(MaskingUtils.mask(null)).isEqualTo("null");
    }

    @Test
    void 민감_필드가_null이어도_마스킹_처리된다() {
        TestUser user = new TestUser("testUser", null);

        String masked = MaskingUtils.mask(user);

        assertThat(masked)
                .contains("name=testUser")
                .contains("password=****");
    }

    @Test
    void 일반_필드가_null이면_null로_표시된다() {
        TestUser user = new TestUser(null, "secretPassword");

        String masked = MaskingUtils.mask(user);

        assertThat(masked)
                .contains("name=null")
                .contains("password=****");
    }

    @Test
    void 객체_문자열_변환시_클래스이름이_포함된다() {
        TestUser user = new TestUser("testUser", "secretPassword");

        String masked = MaskingUtils.mask(user);

        assertThat(masked)
                .startsWith("TestUser[")
                .endsWith("]");
    }

    @Test
    void 여러_필드가_있는_객체는_쉼표로_구분된다() {
        TestUserWithMultipleFields user = new TestUserWithMultipleFields(
                "testUser",
                "secretPassword",
                25,
                "test@email.com"
        );

        String masked = MaskingUtils.mask(user);

        assertThat(masked)
                .contains("name=testUser")
                .contains("password=****")
                .contains("age=25")
                .contains("email=test@email.com")
                .matches("TestUserWithMultipleFields\\[.*,.*,.*,.*\\]")
                .contains(", ");  // 필드들이 쉼표와 공백으로 구분되는지 확인
    }

    @Test
    void exclude_어노테이션이_붙은_필드는_제외된다() {
        ExcludeUser user = new ExcludeUser("testUser", "secretPassword");

        String masked = MaskingUtils.mask(user);

        assertThat(masked)
                .contains("name=testUser")
                .contains("password=<excluded>")
                .doesNotContain("secretPassword");
    }

    @Test
    void exclude_어노테이션이_없는_필드는_출력된다() {
        ExcludeUser user = new ExcludeUser("testUser", "secretPassword");

        String masked = MaskingUtils.mask(user);

        assertThat(masked)
                .contains("name=testUser");
    }

    @Test
    void 필드_접근_불가_시_에러_메시지가_출력된다() throws IllegalAccessException {
        // given
        Object target = new Object();
        Field field = mock(Field.class);
        when(field.getName()).thenReturn("secret");
        when(field.get(target)).thenThrow(new IllegalAccessException());
        when(field.isAnnotationPresent(any())).thenReturn(false);
        doNothing().when(field).setAccessible(true);

        // when
        String result = invokeFormatFieldViaReflection(field, target);

        // then
        assertThat(result).isEqualTo("secret=" + LOG_ERROR_VALUE.message());
    }

    // MaskingUtils.formatField을 직접 호출할 수 없으므로 reflection 사용
    private String invokeFormatFieldViaReflection(Field field, Object target) {
        try {
            var utilsClass = Class.forName("com.global.utils.MaskingUtils");
            var method = utilsClass.getDeclaredMethod("formatField", Field.class, Object.class);
            method.setAccessible(true);
            return (String) method.invoke(null, field, target);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    static class TestUser {
        private final String name;

        @Sensitive
        private final String password;

        TestUser(String name, String password) {
            this.name = name;
            this.password = password;
        }
    }

    static class TestUserWithMultipleFields {
        private final String name;
        @Sensitive
        private final String password;
        private final int age;
        private final String email;

        TestUserWithMultipleFields(String name, String password, int age, String email) {
            this.name = name;
            this.password = password;
            this.age = age;
            this.email = email;
        }
    }

    static class ExcludeUser {
        private final String name;

        @ExcludeFromLogging
        private final String password;

        ExcludeUser(String name, String password) {
            this.name = name;
            this.password = password;
        }
    }
}
