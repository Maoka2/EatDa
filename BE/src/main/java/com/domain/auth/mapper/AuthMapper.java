package com.domain.auth.mapper;

import com.domain.auth.dto.response.SignInResponse;
import com.domain.auth.dto.response.TokenResponse;
import com.domain.auth.jwt.Jwt;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants.ComponentModel;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = ComponentModel.SPRING,
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface AuthMapper {
    SignInResponse toResponse(Jwt jwt);

    TokenResponse toResponse(String accessToken);
}
