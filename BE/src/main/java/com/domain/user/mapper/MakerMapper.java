package com.domain.user.mapper;

import com.domain.user.dto.request.MakerSignUpBaseRequest;
import com.domain.user.dto.response.MakerSignUpResponse;
import com.domain.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants.ComponentModel;
import org.mapstruct.ReportingPolicy;

/**
 * Maker 도메인에서 사용하는 객체 간 변환을 담당하는 MapStruct 매퍼 인터페이스
 */
@Mapper(
        componentModel = ComponentModel.SPRING,         // Spring Bean으로 등록 (@Component)
        unmappedTargetPolicy = ReportingPolicy.IGNORE   // 매핑되지 않은 필드는 무시
)
public interface MakerMapper {

    // @formatter:off
    /**
     * role 필드는 고정 값 "MAKER"로 설정
     * nickname 필드는 고정 값 "MAKER"로 설정
     */
    // @formatter:on
    @Mapping(target = "role", constant = "MAKER")
    @Mapping(target = "nickname", constant = "MAKER")
    User toEntity(MakerSignUpBaseRequest request);

    MakerSignUpResponse toResponse(User maker);
}
