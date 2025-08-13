package com.domain.store.mapper;

import com.domain.store.entity.Store;
import com.domain.user.dto.request.MakerSignUpBaseRequest;
import com.domain.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants.ComponentModel;
import org.mapstruct.ReportingPolicy;

/**
 * Store 도메인에서 사용하는 객체 간 변환을 담당하는 MapStruct 매퍼 인터페이스
 */
@Mapper(
        componentModel = ComponentModel.SPRING,         // Spring Bean으로 등록 (@Component)
        unmappedTargetPolicy = ReportingPolicy.IGNORE   // 매핑되지 않은 필드는 무시
)
public interface StoreMapper {

    /**
     * maker 필드는 전달받는 User Entity로 설정
     */
    @Mapping(target = "maker", source = "maker")
    Store toEntity(MakerSignUpBaseRequest request, User maker, String licenseUrl, long h3Index7, long h3Index8,
                   long h3Index9, long h3Index10);
}
