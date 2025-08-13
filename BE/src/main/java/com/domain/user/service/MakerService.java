package com.domain.user.service;

import com.domain.user.dto.request.MakerCheckEmailRequest;
import com.domain.user.dto.request.MakerSignUpBaseRequest;
import com.domain.user.dto.request.MakerSignUpMenuRequest;
import com.domain.user.entity.User;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface MakerService {

    User registerMaker(MakerSignUpBaseRequest baseRequest, List<MakerSignUpMenuRequest> menuRequests,
                       MultipartFile licenseImageRequest, List<MultipartFile> menuImageRequests);

    void validateEmailAvailable(MakerCheckEmailRequest request);
}
