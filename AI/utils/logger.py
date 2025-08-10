"""
로깅 유틸리티
공통 로깅 기능을 제공
"""

import logging
import sys
from datetime import datetime


def setup_logger(name: str = "ai_api", level: int = logging.INFO) -> logging.Logger:
    """
    로거(logger)를 설정하고 반환
    - name: 로그에 표시될 로거 이름 (보통 서비스/모듈명)
    - level: 출력할 로그 레벨 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    
    Returns:
        logging.Logger: 설정이 완료된 로거 객체
    """
    logger = logging.getLogger(name)  # 지정한 이름의 로거 생성/가져오기
    logger.setLevel(level)            # 로거가 기록할 최소 로그 레벨 설정
    
    # 핸들러가 이미 있으면 추가하지 않음 (중복방지)
    if not logger.handlers:
        # 콘솔 핸들러 생성
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        
        # 로그 메시지 출력 형식(포맷) 지정
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            # asctime: 로그 발생 시간
            # name: 로거 이름
            # levelname: 로그 레벨 (INFO, ERROR 등)
            # message: 실제 로그 메시지 내용
        )
        console_handler.setFormatter(formatter)
        
        # 핸들러를 로거에 추가
        logger.addHandler(console_handler)
    
    return logger


def log_request(logger: logging.Logger, request_data: dict):
    """
    API 요청 데이터를 INFO 레벨로 로그에 기록
    - logger: 사용할 로거 인스턴스
    - request_data: 요청 내용을 담은 딕셔너리
    """
    logger.info(f"Request received: {request_data}")


def log_response(logger: logging.Logger, response_data: dict):
    """
    API 응답 데이터를 INFO 레벨로 로그에 기록합니다.
    - logger: 사용할 로거 인스턴스
    - response_data: 응답 내용을 담은 딕셔너리
    """
    logger.info(f"Response sent: {response_data}")


def log_error(logger: logging.Logger, error: Exception, context: str = ""):
    """
    에러 발생 시 ERROR 레벨로 로그에 기록합니다.
    - logger: 사용할 로거 인스턴스
    - error: 발생한 예외 객체
    - context: 에러가 발생한 상황을 설명하는 문자열 (선택 사항)
    - exc_info=True 덕분에 에러 스택(Traceback)도 함께 출력됩니다.
    """
    logger.error(f"Error in {context}: {str(error)}", exc_info=True)



# 기본 로거 인스턴스 생성
# - 다른 모듈에서 바로 import 하여 사용 가능
default_logger = setup_logger()
