package com.domain.menu.mapper;

import com.domain.menu.dto.response.MenuGetResponse;
import com.domain.menu.entity.Menu;
import com.domain.store.entity.Store;
import com.domain.user.dto.request.MakerSignUpMenuRequest;
import com.global.filestorage.FileUrlResolver;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants.ComponentModel;
import org.mapstruct.ReportingPolicy;

/**
 * Menu 도메인에서 사용하는 객체 간 변환을 담당하는 MapStruct 매퍼 인터페이스
 */
@Mapper(
        componentModel = ComponentModel.SPRING,         // Spring Bean으로 등록 (@Component)
        unmappedTargetPolicy = ReportingPolicy.IGNORE,   // 매핑되지 않은 필드는 무시
        uses = FileUrlResolver .class
)
public interface MenuMapper {

    /**
     * store 필드는 전달받는 Store Entity로 설정
     */
    @Mapping(target = "name", source = "request.name")
    @Mapping(target = "store", source = "store")
    @Mapping(target = "imageUrl", source = "imageUrl")
    Menu toEntity(MakerSignUpMenuRequest request, Store store, String imageUrl);

    @Mapping(target = "imageUrl", source = "imageUrl", qualifiedByName = "toPublicUrl")
    MenuGetResponse toResponse(Menu menu);

    List<MenuGetResponse> toResponse(List<Menu> menuList);
}
