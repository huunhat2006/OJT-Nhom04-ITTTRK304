// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service;

import com.example.bton.dto.response.GlobalSearchResponse;

public interface SearchService {
    GlobalSearchResponse globalSearch(Long spaceId, Long userId, String query);
}
