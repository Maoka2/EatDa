package com.domain.review.service;

import java.nio.file.Path;

public interface ReviewThumbnailService {

    Path extractThumbnail(final String videoUrl, final String filePath, final String fileName);
}
