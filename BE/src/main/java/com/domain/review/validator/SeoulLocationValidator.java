package com.domain.review.validator;

import com.domain.review.constants.ReviewConstants;
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
            case LATITUDE -> value >= ReviewConstants.MIN_LATITUDE && value <= ReviewConstants.MAX_LATITUDE;
            case LONGITUDE -> value >= ReviewConstants.MIN_LONGITUDE && value <= ReviewConstants.MAX_LONGITUDE;
        };
    }
}
