// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.response.DashboardSummaryResponse;
import com.example.bton.dto.response.TopExpenseCategoryResponse;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/dashboard", "/api/dashboard"})
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard summary and top expenses statistics")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @Operation(summary = "Get dashboard summary metrics (cached with 5-minute TTL)")
    public ResponseEntity<DashboardSummaryResponse> getSummary(
            @RequestParam(required = false) Long spaceId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(dashboardService.getSummary(spaceId, currentUser.getId(), month, year));
    }

    @GetMapping("/top-expenses")
    @Operation(summary = "Get top 5 expense categories for current/specified month")
    public ResponseEntity<List<TopExpenseCategoryResponse>> getTopExpenses(
            @RequestParam(required = false) Long spaceId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(dashboardService.getTopExpenses(spaceId, currentUser.getId(), month, year));
    }
}
