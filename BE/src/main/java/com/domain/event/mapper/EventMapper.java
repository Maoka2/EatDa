package com.domain.event.mapper;

import com.domain.event.dto.response.EventGetResponse;
import com.domain.event.entity.Event;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface EventMapper {

    @Mapping(target = "imageUrl", source = "eventAsset.path")
    EventGetResponse toResponse(Event event);

    List<EventGetResponse> toResponse(List<Event> events);
}
