package com.global.utils;

import static org.assertj.core.api.Assertions.assertThat;

import com.global.annotation.Sensitive;
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
}
