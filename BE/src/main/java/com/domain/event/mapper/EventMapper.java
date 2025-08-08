package com.domain.event.mapper;

import com.domain.event.entity.Event;
import com.domain.store.entity.Store;
import com.global.constants.Status;
import org.mapstruct.Mapper;

import java.time.LocalDate;

@Mapper
public interface EventMapper {

    default Event toPendingEvent(final Store store, final LocalDate startDate, final LocalDate endDate) {
        return Event.builder()
                .store(store)
                .startDate(startDate)
                .endDate(endDate)
                .status(Status.PENDING)
                .build();
    }
}
