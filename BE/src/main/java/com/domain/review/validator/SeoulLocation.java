package com.domain.review.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = SeoulLocationValidator.class)
@Documented
public @interface SeoulLocation {
    String message() default "좌표는 서울 지역 범위여야 합니다";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    LocationType type();

    enum LocationType {
        LATITUDE, LONGITUDE
    }
}
