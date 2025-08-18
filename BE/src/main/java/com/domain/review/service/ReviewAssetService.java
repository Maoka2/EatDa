package com.domain.review.service;

import com.domain.review.constants.ReviewAssetType;
import com.domain.review.dto.redis.ReviewAssetGenerateMessage;
import com.domain.review.dto.redis.ReviewAssetGenerateMessage.MenuItem;
import com.global.config.FileStorageProperties;
import com.global.filestorage.FileUrlResolver;
import java.util.List;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewAssetService {
    private final FileUrlResolver fileUrlResolver;
    private final FileStorageProperties fileStorageProperties;

    public ReviewAssetGenerateMessage prepareForRedis(
            long reviewAssetId,
            ReviewAssetType type,
            String prompt,
            long storeId,
            long userId,
            List<MenuItem> menu,
            List<String> referenceImagesLocalPaths  // 로컬 파일 시스템 경로 배열
    ) {
        // 컨테이너 내부 베이스(/root/eatda), 호스트 베이스(/home/ubuntu/eatda/test)
        final String localBase = fileStorageProperties.getBaseDirPath().toString();
        final String hostBase = fileStorageProperties.getHostBaseDir();

        final List<String> resolvedReferences =
                (type == ReviewAssetType.IMAGE)
                        ? referenceImagesLocalPaths.stream()
                        .map(p -> {
                            String replaced = p.replaceFirst("^" + Pattern.quote(localBase), hostBase);
                            if (p.equals(replaced)) {
                                log.warn("[ReviewAssetService] path prefix not matched: localBase='{}', path='{}'",
                                        localBase, p);
                            }
                            return replaced;
                        })
                        .toList()
                        : referenceImagesLocalPaths.stream()
                                .map(fileUrlResolver::toPublicUrl)
                                .toList();

        log.info("[ReviewAssetService] localBase={}, hostBase={}", localBase, hostBase);
        log.info("[ReviewAssetService] referenceImagesLocalPaths={}", referenceImagesLocalPaths);
        log.info("[ReviewAssetService] resolvedReferences={}", resolvedReferences);

        return ReviewAssetGenerateMessage.of(
                reviewAssetId,
                type,
                prompt,
                storeId,
                userId,
                menu,
                resolvedReferences
        );
    }
}
