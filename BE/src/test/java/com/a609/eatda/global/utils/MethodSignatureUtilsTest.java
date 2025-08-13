package com.a609.eatda.global.utils;

import static com.global.constants.Messages.LOG_EXCLUDED_VALUE;
import static org.assertj.core.api.Assertions.assertThat;

import com.global.annotation.ExcludeFromLogging;
import com.global.utils.MethodSignatureUtils;
import java.lang.reflect.Method;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class MethodSignatureUtilsTest {

    @Test
    void 로그_출력시_ExcludeFromLogging_파라미터는_제외된다() throws NoSuchMethodException {
        // given
        Object[] args = {new SampleArg("value1"), "secret"};
        ProceedingJoinPoint joinPoint = Mockito.mock(ProceedingJoinPoint.class);
        MethodSignature methodSignature = Mockito.mock(MethodSignature.class);
        Method method = TestController.class.getDeclaredMethod("testMethod", SampleArg.class, String.class);

        Mockito.when(joinPoint.getSignature()).thenReturn(methodSignature);
        Mockito.when(methodSignature.getDeclaringType()).thenReturn(TestController.class);
        Mockito.when(methodSignature.getName()).thenReturn("testMethod");
        Mockito.when(methodSignature.getMethod()).thenReturn(method);
        Mockito.when(methodSignature.getParameterNames()).thenReturn(new String[]{"visible", "hidden"});
        Mockito.when(joinPoint.getArgs()).thenReturn(args);

        // when
        String result = MethodSignatureUtils.formatMethodSignature(joinPoint);

        // then
        assertThat(result)
                .startsWith("TestController.testMethod(")
                .contains("SampleArg[value=value1]")
                .contains(LOG_EXCLUDED_VALUE.message())
                .doesNotContain("secret");
    }

    @Test
    void ExcludeFromLogging_어노테이션이_없으면_값이_출력된다() throws NoSuchMethodException {
        // given
        Object[] args = {new SampleArg("value1")};
        ProceedingJoinPoint joinPoint = Mockito.mock(ProceedingJoinPoint.class);
        MethodSignature methodSignature = Mockito.mock(MethodSignature.class);
        Method method = TestController.class.getDeclaredMethod("nonExcludedMethod", SampleArg.class);

        Mockito.when(joinPoint.getSignature()).thenReturn(methodSignature);
        Mockito.when(methodSignature.getDeclaringType()).thenReturn(TestController.class);
        Mockito.when(methodSignature.getName()).thenReturn("nonExcludedMethod");
        Mockito.when(methodSignature.getMethod()).thenReturn(method);
        Mockito.when(methodSignature.getParameterNames()).thenReturn(new String[]{"visible"});
        Mockito.when(joinPoint.getArgs()).thenReturn(args);

        // when
        String result = MethodSignatureUtils.formatMethodSignature(joinPoint);

        // then
        assertThat(result)
                .contains("visible=SampleArg[value=value1]")
                .doesNotContain(LOG_EXCLUDED_VALUE.message());
    }

    @Test
    void null_파라미터는_null_문자열로_표현된다() throws NoSuchMethodException {
        // given
        Object[] args = {null};
        ProceedingJoinPoint joinPoint = Mockito.mock(ProceedingJoinPoint.class);
        MethodSignature methodSignature = Mockito.mock(MethodSignature.class);
        Method method = TestController.class.getDeclaredMethod("nullParamMethod", Object.class);

        Mockito.when(joinPoint.getSignature()).thenReturn(methodSignature);
        Mockito.when(methodSignature.getDeclaringType()).thenReturn(TestController.class);
        Mockito.when(methodSignature.getName()).thenReturn("nullParamMethod");
        Mockito.when(methodSignature.getMethod()).thenReturn(method);
        Mockito.when(methodSignature.getParameterNames()).thenReturn(new String[]{"param"});
        Mockito.when(joinPoint.getArgs()).thenReturn(args);

        // when
        String result = MethodSignatureUtils.formatMethodSignature(joinPoint);

        // then
        assertThat(result)
                .contains("param=null");
    }


    static class TestController {
        public void testMethod(SampleArg visible, @ExcludeFromLogging String hidden) {
        }

        public void nonExcludedMethod(SampleArg visible) {
        }

        public void nullParamMethod(Object param) {
        }
    }

    record SampleArg(String value) {
    }
}
