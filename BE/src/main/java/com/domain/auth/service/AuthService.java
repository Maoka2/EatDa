package com.domain.auth.service;

import com.domain.auth.dto.request.SignInRequest;
import com.domain.auth.jwt.Jwt;

public interface AuthService {

    Jwt signIn(SignInRequest request);

    void signOut();
}
