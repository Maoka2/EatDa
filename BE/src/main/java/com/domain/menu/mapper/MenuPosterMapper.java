package com.domain.menu.mapper;

import com.domain.menu.dto.response.MenuPosterGetResponse;
import com.domain.menu.entity.MenuPoster;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants.ComponentModel;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = ComponentModel.SPRING,         // Spring Bean으로 등록 (@Component)
        unmappedTargetPolicy = ReportingPolicy.IGNORE   // 매핑되지 않은 필드는 무시
)
public interface MenuPosterMapper {

    @Mapping(target = "imageUrl", source = "menuPosterAsset.path")
    MenuPosterGetResponse toResponse(MenuPoster menuPoster);

    List<MenuPosterGetResponse> toResponse(List<MenuPoster> menuPosters);
}
