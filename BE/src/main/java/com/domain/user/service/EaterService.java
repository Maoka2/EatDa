package com.domain.user.service;

import com.domain.user.dto.request.EaterCheckEmailRequest;
import com.domain.user.dto.request.EaterCheckNicknameRequest;
import com.domain.user.dto.request.EaterSignUpRequest;
import com.domain.user.entity.User;

public interface EaterService {

    User registerEater(EaterSignUpRequest request);

    void validateEmailAvailable(EaterCheckEmailRequest request);

    void validateNicknameAvailable(EaterCheckNicknameRequest request);
}
