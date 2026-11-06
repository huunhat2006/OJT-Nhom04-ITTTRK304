// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.response.GlobalSearchResponse;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/search", "/api/search"})
@RequiredArgsConstructor
@Tag(name = "Search", description = "Global search across transactions, categories, and savings goals")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    @Operation(summary = "Global search across transactions, categories, and savings goals")
    public ResponseEntity<GlobalSearchResponse> search(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(required = false) Long spaceId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        String searchTerm = (q != null && !q.isBlank()) ? q : keyword;
        return ResponseEntity.ok(searchService.globalSearch(spaceId, currentUser.getId(), searchTerm));
    }
}
