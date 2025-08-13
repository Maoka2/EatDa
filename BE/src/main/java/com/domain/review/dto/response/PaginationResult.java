package com.domain.review.dto.response;

import java.util.List;

public record PaginationResult<T>(List<T> content, boolean hasNext) {}
