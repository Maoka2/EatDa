package com.global.aop;

import static org.springframework.boot.logging.LogLevel.DEBUG;
import static org.springframework.boot.logging.LogLevel.INFO;
import static org.springframework.boot.logging.LogLevel.TRACE;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;


/**
 * 애플리케이션의 각 계층(Controller, Service, Repository)에 대한 로깅을 처리하는 Aspect
 */
@Aspect
@Slf4j
@Component
@RequiredArgsConstructor
public class LoggerAspect {
    // 포인트컷용 상수
    public static final String CONTROLLER_PATTERN = "execution(* com.global..*Controller.*(..))";
    public static final String SERVICE_PATTERN = "execution(* com.global..*.service.*(..))";
    public static final String REPOSITORY_PATTERN = "execution(* com.global..*.repository.*(..))";

    private final LogExecutionHandler executionHandler;

    // ======= Pointcut =======

    @Pointcut(CONTROLLER_PATTERN)
    private void controllerLayer() {
    }

    @Pointcut(SERVICE_PATTERN)
    private void serviceLayer() {
    }

    @Pointcut(REPOSITORY_PATTERN)
    private void repositoryLayer() {
    }

    // ======= Around per Layer =======

    /**
     * Controller 계층의 메서드 실행을 로깅합니다 (INFO 레벨).
     */
    @Around("controllerLayer()")
    public Object logController(final ProceedingJoinPoint joinPoint) throws Throwable {
        return executionHandler.executeWithLevel(joinPoint, INFO);
    }

    /**
     * Service 계층의 메서드 실행을 로깅합니다 (DEBUG 레벨).
     */
    @Around("serviceLayer()")
    public Object logService(final ProceedingJoinPoint joinPoint) throws Throwable {
        return executionHandler.executeWithLevel(joinPoint, DEBUG);
    }

    /**
     * Repository 계층의 메서드 실행을 로깅합니다 (TRACE 레벨).
     */
    @Around("repositoryLayer()")
    public Object logRepository(final ProceedingJoinPoint joinPoint) throws Throwable {
        return executionHandler.executeWithLevel(joinPoint, TRACE);
    }
}
