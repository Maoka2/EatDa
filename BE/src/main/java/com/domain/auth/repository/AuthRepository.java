package com.domain.auth.repository;

public interface AuthRepository {

    void saveToken(String email, String refreshToken);

    String getToken(String email);

    void deleteToken(String email);
}
