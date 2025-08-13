package com.domain.event.validator;

import com.domain.event.entity.Event;
import com.domain.event.entity.EventAsset;
import com.domain.user.entity.User;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class EventValidator {
    public static void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new ApiException(ErrorCode.EVENT_INVALID_DATE_RANGE);
        }
        if (startDate.isBefore(LocalDate.now())) {
            throw new ApiException(ErrorCode.EVENT_START_DATE_IN_PAST);
        }
    }

    public static void validateOwnership(User maker, Event event) {
        if (!event.getStore().getMaker().getId().equals(maker.getId())) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
    }

    public static void validateOwnership(User maker, EventAsset asset) {
        validateOwnership(maker, asset.getEvent());
    }

    public static void validatePendingStatus(Event event) {
        if (!event.getStatus().isPending()) {
            throw new ApiException(ErrorCode.EVENT_NOT_PENDING, event.getId());
        }
    }

    public static void validateForFinalization(EventAsset asset) {
        if (!asset.getStatus().isSuccess()) {
            throw new ApiException(ErrorCode.ASSET_NOT_SUCCESS, asset.getId());
        }

        if (asset.getType() == null) {
            throw new ApiException(ErrorCode.ASSET_TYPE_REQUIRED, asset.getId());
        }

        if (!asset.getType().equals(AssetType.IMAGE)) {
            throw new ApiException(ErrorCode.ASSET_TYPE_MISMATCH);
        }
    }
}
