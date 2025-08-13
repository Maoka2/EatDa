package com.domain.auth.service;

import com.domain.auth.dto.request.SignInRequest;
import com.domain.auth.dto.request.SignOutRequest;
import com.domain.auth.dto.request.TokenRequest;
import com.domain.auth.jwt.Jwt;

public interface AuthService {

    Jwt signIn(SignInRequest request);

    void signOut(SignOutRequest request);

    String reissueToken(TokenRequest request);
}
