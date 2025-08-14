package com.global.utils.geo.validation;

import com.global.utils.geo.SeoulBoundary;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class SeoulLocationValidator implements ConstraintValidator<SeoulLocation, Double> {
    private SeoulLocation.LocationType type;

    @Override
    public void initialize(final SeoulLocation constraintAnnotation) {
        this.type = constraintAnnotation.type();
    }

    @Override
    public boolean isValid(Double value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        return switch (type) {
            case LATITUDE -> value >= SeoulBoundary.MIN_LATITUDE && value <= SeoulBoundary.MAX_LATITUDE;
            case LONGITUDE -> value >= SeoulBoundary.MIN_LONGITUDE && value <= SeoulBoundary.MAX_LONGITUDE;
        };
    }
}
