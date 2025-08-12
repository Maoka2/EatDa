package com.domain.review.service;

import com.domain.review.constants.ReviewAssetType;
import com.domain.review.dto.redis.ReviewAssetGenerateMessage;
import com.domain.review.dto.redis.ReviewAssetGenerateMessage.MenuItem;
import com.global.filestorage.FileUrlResolver;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewAssetService {
    private final FileUrlResolver fileUrlResolver;

    public ReviewAssetGenerateMessage prepareForRedis(
            long reviewAssetId,
            ReviewAssetType type,
            String prompt,
            long storeId,
            long userId,
            List<MenuItem> menu,
            List<String> referenceImagesLocalPaths  // 로컬 파일 시스템 경로 배열
    ) {
        List<String> publicUrls = referenceImagesLocalPaths.stream()
                .map(fileUrlResolver::toPublicUrl)
                .toList();

        log.info("ReviewAssetService");
        log.info("referenceImagesLocalPaths: {}", referenceImagesLocalPaths);
        log.info(publicUrls.toString());
        return ReviewAssetGenerateMessage.of(
                reviewAssetId,
                type,
                prompt,
                storeId,
                userId,
                menu,
                publicUrls
        );
    }
}
