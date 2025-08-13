package com.global.filestorage;

import static com.global.constants.ErrorCode.FILE_UPLOAD_ERROR;
import static com.global.constants.ErrorCode.INVALID_FILE_TYPE;
import static com.global.filestorage.constants.FileStorageConstants.EMPTY;
import static com.global.filestorage.constants.FileStorageConstants.HYPHEN;
import static com.global.filestorage.constants.FileStorageConstants.MIME_TO_EXT;
import static com.global.filestorage.constants.FileStorageConstants.MIME_TYPE_WEBP;
import static com.global.filestorage.constants.FileStorageConstants.NULL;

import com.global.config.FileStorageProperties;
import com.global.config.FileStorageProperties.Video;
import com.global.constants.ErrorCode;
import com.global.exception.GlobalException;
import com.global.utils.ImageOptimizationUtils;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 로컬 디스크에 파일을 저장하는 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Getter
public class LocalFileStorageService implements FileStorageService {

    /**
     * 허용 스킴 (SSRF 최소 방어)
     */
    private static final Set<String> ALLOWED_SCHEMES = Set.of("http", "https");
    /**
     * 리다이렉트 최대 허용 횟수
     */
    private static final int MAX_REDIRECTS = 2;

    private final FileStorageProperties properties;

    /**
     * 이미지 파일을 저장소에 저장 - WebP 변환 및 리사이징 등 최적화 수행 후 저장
     *
     * @param file         업로드된 원본 이미지 파일
     * @param relativePath 저장 경로 (루트 기준 상대경로)
     * @param originalName 원본 파일명 (로깅/예외 용도)
     * @return 저장된 파일의 전체 경로
     */
    @Override
    public String storeImage(final MultipartFile file, final String relativePath, final String originalName,
                             final boolean convertToWebp) {

        try {
            String originalMimeType = extractAndValidateMimeType(file);
            InputStream optimizedStream = ImageOptimizationUtils.optimize(file, convertToWebp);
            String targetMimeType = convertToWebp ? MIME_TYPE_WEBP : originalMimeType;

            return storeOptimizedImage(optimizedStream, targetMimeType, properties.getImageRoot(), relativePath);
        } catch (IOException e) {
            throw new GlobalException(FILE_UPLOAD_ERROR, originalName, e);
        }
    }

    @Override
    public String storeImage(final MultipartFile file,
                             final String relativePath,
                             final String originalName) {
        try {
            // 1) MIME 타입 검증 및 확장자 도출 (등록되지 않은 타입이면 예외)
            final String mimeType = extractAndValidateMimeType(file);
            final String extension = resolveExtensionFromMimeType(mimeType);

            // 2) 상대 경로 정리(디렉토리 트래버설 방지) 후 전체 경로 생성
            final String safeRelativePath = sanitize(relativePath);
            final Path fullPath = generateFullPath(properties.getImageRoot(), safeRelativePath, extension);

            // 3) 디렉토리 생성은 generateFullPath에서 보장됨 → 파일 그대로 저장
            //    (변환/리사이징/압축 등 일절 수행하지 않음)
            file.transferTo(fullPath.toFile());

            // 4) 저장된 전체 경로 반환
            return fullPath.toString();
        } catch (IOException e) {
            throw new GlobalException(FILE_UPLOAD_ERROR, originalName, e);
        }
    }

    /**
     * 비디오 파일을 저장소에 저장 - 현재는 인코딩/리사이징 없이 원본 그대로 저장
     *
     * @param file         업로드된 비디오 파일
     * @param relativePath 저장 경로 (루트 기준 상대경로)
     * @param originalName 원본 파일명 (로깅/예외 용도)
     * @return 저장된 파일의 전체 경로
     */
    @Override
    public String storeVideo(final MultipartFile file, final String relativePath, final String originalName) {
        return storeOptimizedVideo(file, properties.getVideoRoot(), relativePath, originalName);
    }

    /**
     * 저장된 파일을 Resource로 로드
     *
     * @param filePath 파일 경로 (전체 경로)
     * @return Spring Resource 객체
     */
    @Override
    public Resource loadAsResource(final String filePath) {
        try {
            Path file = Paths.get(filePath);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new GlobalException(ErrorCode.FILE_NOT_FOUND, filePath);
            }
        } catch (MalformedURLException e) {
            throw new GlobalException(ErrorCode.FILE_READ_ERROR, filePath, e);
        }
    }

    @Override
    public String storeVideoFromUrl(final String url,
                                    final String relativePath,
                                    final String originalName) {
        Video videoProps = properties.getVideo();

        try {
            // 1) URL 파싱 & 스킴 검증
            URI downloadUri = resolveDownloadUri(url);

            // 2) 다운로드(리다이렉트 포함)
            HttpResponse<InputStream> resp = fetchWithRedirects(httpClient(), downloadUri);
            int status = resp.statusCode();

            if (status != 200) {
                closeQuietly(resp.body());
                throw new GlobalException(ErrorCode.FILE_DOWNLOAD_ERROR,
                        "HTTP status " + status + " for " + downloadUri);
            }

            // 3) 헤더 기반 선 검증 (크기 / MIME 1차)
            long contentLength = resp.headers().firstValueAsLong("Content-Length").orElse(-1L);

            if (contentLength > videoProps.getMaxSizeBytes()) {
                closeQuietly(resp.body());
                throw new GlobalException(ErrorCode.FILE_TOO_LARGE,
                        "Content-Length exceeds limit: " + contentLength);
            }

            String contentType = resp.headers()
                    .firstValue("Content-Type")
                    .map(v -> v.split(";")[0].trim().toLowerCase())
                    .orElse(null);

            if (!Objects.isNull(contentType) && !videoProps.getAllowedMimeSet().contains(contentType)) {
                closeQuietly(resp.body());
                throw new GlobalException(INVALID_FILE_TYPE, contentType);
            }

            // 4) Content-Type 미제공/미등록이면 URL 확장자 기반 보정 + 허용 목록 확인
            if (Objects.isNull(contentType) || !MIME_TO_EXT.containsKey(contentType)) {
                if (!videoProps.getAllowedMimeSet().contains(contentType)) {
                    closeQuietly(resp.body());
                    throw new GlobalException(INVALID_FILE_TYPE, contentType);
                }
            }
            // 5) 최종 경로 생성
            String extension = resolveExtensionFromMimeType(contentType);
            String safeRelativePath = sanitize(relativePath);
            Path finalPath = generateFullPath(properties.getVideoRoot(), safeRelativePath, extension);
            Path parentDir = finalPath.getParent();
            Files.createDirectories(parentDir);

            // 6) 스트리밍 저장 (임시 파일 → 원자적 move)
            final Path tempFile = Files.createTempFile(parentDir, "dl-", ".tmp");
            try (InputStream in = resp.body()) {
                pipeWithLimit(in, tempFile, videoProps.getMaxSizeBytes());
                Files.move(tempFile, finalPath);
            } catch (IOException ex) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignore) {
                }
                throw ex;
            }

            return finalPath.toString();

        } catch (GlobalException ge) {
            throw ge;
        } catch (Exception e) {
            throw new GlobalException(FILE_UPLOAD_ERROR, originalName, e);
        }
    }

    /**
     * 비디오 파일을 최적화하여 저장소에 저장 (MultipartFile 기반)
     *
     * @param file         업로드된 비디오 파일
     * @param baseDir      저장소 루트 디렉토리 (비디오용)
     * @param relativePath 루트 기준 상대 경로
     * @param originalName 원본 파일명 (예외 메시지용)
     * @return 저장된 파일의 전체 경로
     */
    private String storeOptimizedVideo(final MultipartFile file, final String baseDir, final String relativePath,
                                       final String originalName) {
        try {
            String contentType = file.getContentType();
            String extension = resolveExtensionFromMimeType(contentType);
            Path fullPath = generateFullPath(baseDir, relativePath, extension);

            // 파일을 디스크에 저장
            file.transferTo(fullPath.toFile());
            return fullPath.toString();
        } catch (IOException e) {
            throw new GlobalException(FILE_UPLOAD_ERROR, originalName, e);
        }
    }

    /**
     * 최적화된 이미지 파일을 저장소에 저장 (InputStream 기반)
     *
     * @param inputStream  이미지 데이터 스트림
     * @param mimeType     이미지 MIME 타입
     * @param imageRoot    저장소 루트 디렉토리 (이미지용)
     * @param relativePath 루트 기준 상대 경로
     * @return 저장된 파일의 전체 경로
     */
    private String storeOptimizedImage(final InputStream inputStream, final String mimeType, final String imageRoot,
                                       final String relativePath) throws IOException {
        String extension = resolveExtensionFromMimeType(mimeType);

        Path fullPath = generateFullPath(imageRoot, relativePath, extension);

        // 스트림을 디스크에 저장
        Files.copy(inputStream, fullPath);
        return fullPath.toString();
    }

    private String sanitize(String relativePath) {
        if (relativePath == null) {
            return "";
        }
        String cleaned = relativePath.replace("\\", "/")
                .replaceAll("^/+", "")   // 선행 슬래시 제거
                .replaceAll("/+", "/");  // 중복 슬래시 정리
        if (cleaned.contains("..")) {
            throw new IllegalArgumentException("Invalid relativePath: " + cleaned);
        }
        return cleaned;
    }

    /**
     * 고유 파일명을 포함한 전체 파일 경로 생성 + 필요한 디렉토리 생성
     *
     * @param baseDir      루트 디렉토리
     * @param relativePath 상대 경로
     * @param extension    확장자 ('.webp', '.mp4' 등 포함)
     * @return 전체 경로가 포함된 Path 객체
     */
    private Path generateFullPath(final String baseDir, final String relativePath, final String extension)
            throws IOException {
        // UUID 기반 고유 파일명 생성
        String filename = UUID.randomUUID().toString().replace(HYPHEN, EMPTY) + extension;
        Path fullPath = Paths.get(baseDir, relativePath, filename);

        // 디렉토리 없으면 생성
        Files.createDirectories(fullPath.getParent());
        return fullPath;
    }

    /**
     * 유효한 MIME 타입인지 확인하고 반환
     *
     * @param file 업로드된 파일
     * @return 유효한 MIME 타입 (null 이거나 등록되지 않은 경우 예외 발생)
     */
    private String extractAndValidateMimeType(final MultipartFile file) {
        String mimeType = Optional.ofNullable(file.getContentType())
                .orElseThrow(() -> new GlobalException(INVALID_FILE_TYPE, NULL));

        if (!MIME_TO_EXT.containsKey(mimeType)) {
            throw new GlobalException(INVALID_FILE_TYPE, mimeType);
        }

        return mimeType;
    }

    /**
     * MIME 타입에 해당하는 파일 확장자를 반환 - 등록되지 않은 타입이면 예외 발생
     *
     * @param mimeType 파일의 Content-Type
     * @return 파일 확장자 (예: ".webp", ".mp4")
     */
    private String resolveExtensionFromMimeType(final String mimeType) {
        return Optional.ofNullable(MIME_TO_EXT.get(mimeType))
                .orElseThrow(() -> new GlobalException(INVALID_FILE_TYPE, mimeType));
    }

    private HttpClient httpClient() {
        // 연결/요청 타임아웃 모두 video.request-timeout-sec 를 사용
        final Duration timeout = properties.getVideo().getRequestTimeout();
        return HttpClient.newBuilder()
                .connectTimeout(timeout)
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    private URI resolveDownloadUri(final String urlString) {
        if (Objects.isNull(urlString) || urlString.isBlank()) {
            throw new GlobalException(ErrorCode.FILE_DOWNLOAD_ERROR, "URL must not be blank");
        }
        final URI uri;
        try {
            uri = URI.create(urlString.trim());
        } catch (IllegalArgumentException e) {
            throw new GlobalException(ErrorCode.FILE_DOWNLOAD_ERROR, "Invalid URL: " + urlString);
        }
        final String scheme = Optional.ofNullable(uri.getScheme()).orElse("").toLowerCase();
        if (!ALLOWED_SCHEMES.contains(scheme)) {
            throw new GlobalException(ErrorCode.FILE_DOWNLOAD_ERROR, "Unsupported scheme: " + scheme);
        }
        return uri;
    }

    private void closeQuietly(final InputStream in) {
        if (in != null) {
            try {
                in.close();
            } catch (Exception ignore) {
            }
        }
    }

    /**
     * 수동 리다이렉트 처리(GET). 허용 스킴만 통과.
     */
    private HttpResponse<InputStream> fetchWithRedirects(final HttpClient client,
                                                         final URI startUri)
            throws IOException, InterruptedException {

        URI current = startUri;
        for (int i = 0; i <= MAX_REDIRECTS; i++) {
            final HttpRequest req = HttpRequest.newBuilder(current)
                    .timeout(properties.getVideo().getRequestTimeout())
                    .GET()
                    .build();

            final HttpResponse<InputStream> resp =
                    client.send(req, HttpResponse.BodyHandlers.ofInputStream());

            final int status = resp.statusCode();

            // 리다이렉트
            if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                final String location = resp.headers().firstValue("Location").orElse(null);
                if (location == null) {
                    closeQuietly(resp.body());
                    throw new GlobalException(ErrorCode.FILE_DOWNLOAD_ERROR,
                            "Redirect without Location from " + current);
                }
                final URI next = current.resolve(location);

                final String scheme = Optional.ofNullable(next.getScheme()).orElse("").toLowerCase();
                if (!ALLOWED_SCHEMES.contains(scheme)) {
                    closeQuietly(resp.body());
                    throw new GlobalException(ErrorCode.FILE_DOWNLOAD_ERROR,
                            "Redirect to unsupported scheme: " + scheme);
                }

                closeQuietly(resp.body()); // 이전 응답 닫기
                current = next;
                continue;
            }

            // 200 또는 에러 코드면 그대로 반환 (상위에서 판단)
            return resp;
        }

        throw new GlobalException(ErrorCode.FILE_DOWNLOAD_ERROR, "Too many redirects for " + startUri);
    }

    /**
     * InputStream → 파일 스트리밍 복사 (크기 제한 적용).
     */
    private void pipeWithLimit(final InputStream in,
                               final Path target,
                               final long maxBytes) throws IOException {
        try (var out = Files.newOutputStream(target)) {
            final byte[] buf = new byte[8192];
            long total = 0;
            int n;
            while ((n = in.read(buf)) != -1) {
                total += n;
                if (total > maxBytes) {
                    throw new GlobalException(ErrorCode.FILE_TOO_LARGE,
                            "Exceeded max bytes: " + maxBytes);
                }
                out.write(buf, 0, n);
            }
        }
    }
}
