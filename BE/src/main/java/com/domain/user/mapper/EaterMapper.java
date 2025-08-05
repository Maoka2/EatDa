package com.domain.user.mapper;

import com.domain.user.dto.request.EaterSignUpRequest;
import com.domain.user.dto.response.EaterSignUpResponse;
import com.domain.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants.ComponentModel;
import org.mapstruct.ReportingPolicy;

/**
 * Eater 도메인에서 사용하는 객체 간 변환을 담당하는 MapStruct 매퍼 인터페이스
 */
@Mapper(
        componentModel = ComponentModel.SPRING,         // Spring Bean으로 등록 (@Component)
        unmappedTargetPolicy = ReportingPolicy.IGNORE   // 매핑되지 않은 필드는 무시
)
public interface EaterMapper {

    /**
     * role 필드는 고정 값 "EATER"로 설정
     */
    @Mapping(target = "role", constant = "EATER")
    User toEntity(EaterSignUpRequest request);

    EaterSignUpResponse toResponse(User user);
}
