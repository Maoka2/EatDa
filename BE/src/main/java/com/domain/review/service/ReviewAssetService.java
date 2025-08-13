package com.domain.review.service;

import com.domain.review.constants.ReviewAssetType;
import com.domain.review.dto.redis.ReviewAssetGenerateMessage;
import com.domain.review.dto.redis.ReviewAssetGenerateMessage.MenuItem;
import com.global.config.FileStorageProperties;
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
    private final FileStorageProperties fileStorageProperties;

    public ReviewAssetGenerateMessage prepareForRedis(
            long reviewAssetId,
            ReviewAssetType type,
            String prompt,
            long storeId,
            long userId,
            List<MenuItem> menu,
            List<String> referenceImagesLocalPaths
    ) {
        // 컨테이너 내부 베이스(예: /root/eatda)
        final String localBase = normalize(fileStorageProperties.getBaseDirPath().toString());
        // 호스트 실제 베이스(예: /home/ubuntu/eatda/test) - yml에 filestorage.host-base-dir로 설정
        final String hostBase = normalize(fileStorageProperties.getHostBaseDir());

        final List<String> resolvedReferences =
                (type == ReviewAssetType.IMAGE)
                        // 호스트 경로를 컨테이너 경로로 변환
                        ? referenceImagesLocalPaths.stream()
                        .map(p -> toContainerPath(p, hostBase, localBase))
                        .toList()
                        // 그 외 타입은 공개 URL 사용
                        : referenceImagesLocalPaths.stream()
                                .map(fileUrlResolver::toPublicUrl)
                                .toList();

        log.info("[ReviewAssetService] localBase={}, hostBase={}", localBase, hostBase);
        log.info("[ReviewAssetService] referenceImagesLocalPaths={}", referenceImagesLocalPaths);
        log.info("[ReviewAssetService] resolvedReferences={}", resolvedReferences);

        return ReviewAssetGenerateMessage.of(
                reviewAssetId, type, prompt, storeId, userId, menu, resolvedReferences
        );
    }

    private String toContainerPath(String path, String hostBase, String localBase) {
        String p = normalize(path);

        // 이미 컨테이너 경로면 그대로
        if (p.startsWith(localBase)) {
            return p;
        }

        // hostBase가 설정되어 있고, 해당 prefix를 쓰는 경우만 치환
        if (hostBase != null && !hostBase.isBlank() && p.startsWith(hostBase)) {
            return localBase + p.substring(hostBase.length());
        }

        // 매칭 실패 시 경고만 찍고 원본 반환(문제 파악용)
        log.warn("[ReviewAssetService] hostBase prefix not matched: hostBase='{}', path='{}'", hostBase, p);
        return p;
    }

    private String normalize(String s) {
        if (s == null) {
            return null;
        }
        String n = s.replace('\\', '/');
        // 끝에 슬래시 제거
        while (n.endsWith("/") && n.length() > 1) {
            n = n.substring(0, n.length() - 1);
        }
        return n;
    }
}
