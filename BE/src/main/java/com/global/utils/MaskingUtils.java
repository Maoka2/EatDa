package com.global.utils;

import static com.global.constants.Messages.LOG_ERROR_VALUE;
import static com.global.constants.Messages.LOG_EXCLUDED_VALUE;
import static com.global.constants.Messages.LOG_MASKED_VALUE;
import static com.global.constants.Messages.UTILITY_CLASS_ERROR;

import com.global.annotation.ExcludeFromLogging;
import com.global.annotation.Sensitive;
import java.lang.reflect.Field;
import java.util.Objects;
import java.util.StringJoiner;

/**
 * `@Sensitive`는 마스킹 처리, `@ExcludeFromLogging`은 로그 제외 처리를 수행하는 필드 전용 유틸리티 클래스입니다.
 */
public final class MaskingUtils {
    private static final String NULL_TEXT = "null";
    private static final String FIELD_FORMAT = "%s=%s";

    private MaskingUtils() {
        throw new IllegalStateException(UTILITY_CLASS_ERROR.message());
    }

    /**
     * 대상 객체의 필드 중 @Sensitive 어노테이션이 붙은 항목을 마스킹 처리하여 문자열로 반환합니다.
     */
    public static String mask(final Object target) {
        if (Objects.isNull(target)) {
            return NULL_TEXT;
        }

        Class<?> clazz = target.getClass();
        Field[] fields = clazz.getDeclaredFields();

        return getString(target, clazz, fields);
    }

    /**
     * 객체의 필드 정보를 문자열로 변환하여 반환합니다.
     */
    private static String getString(final Object target, final Class<?> clazz, final Field[] fields) {
        StringJoiner result = new StringJoiner(", ", clazz.getSimpleName() + "[", "]");

        for (Field field : fields) {
            result.add(formatField(field, target));
        }

        return result.toString();
    }

    // @formatter:off
    /**
     * 필드를 문자열로 변환합니다.
     *
     * @return 필드명=값 형태의 문자열. 예: fieldName=value
     *   - 제외된 필드인 경우: fieldName=<excluded>
     *   - 민감 정보인 경우: fieldName=****
     *   - 일반 필드인 경우: fieldName={실제값}
     *   - 접근 오류 시: fieldName=<error>
     */
    // @formatter:on
    private static String formatField(final Field field, final Object target) {
        field.setAccessible(true); // private 필드에 접근 가능하도록 설정
        try {
            if (isExcluded(field)) {
                return formatExcluded(field);
            }

            Object value = field.get(target);
            String displayValue = isSensitive(field) ? LOG_MASKED_VALUE.message() : String.valueOf(value);
            return formatKeyValue(field.getName(), displayValue);
        } catch (IllegalAccessException e) {
            return formatKeyValue(field.getName(), LOG_ERROR_VALUE.message());
        }
    }

    private static boolean isExcluded(final Field field) {
        return field.isAnnotationPresent(ExcludeFromLogging.class);
    }

    private static boolean isSensitive(final Field field) {
        return field.isAnnotationPresent(Sensitive.class);
    }

    private static String formatExcluded(final Field field) {
        return formatKeyValue(field.getName(), LOG_EXCLUDED_VALUE.message());
    }

    private static String formatKeyValue(final String key, final String value) {
        return String.format(FIELD_FORMAT, key, value);
    }
}
