// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.response.SpendingAnalysisResponse;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.AlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/alerts", "/api/alerts"})
@RequiredArgsConstructor
@Tag(name = "Spending Alerts", description = "Smart spending alerts and financial health analysis")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class AlertController {

    private final AlertService alertService;

    @GetMapping("/analysis")
    @Operation(summary = "Get smart spending alerts and financial health analysis")
    public ResponseEntity<SpendingAnalysisResponse> getSpendingAnalysis(
            @RequestParam(required = false) Long spaceId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(alertService.getSpendingAnalysis(spaceId, currentUser.getId(), month, year));
    }

    @PostMapping("/check-now")
    @Operation(summary = "Trigger manual spending check")
    public ResponseEntity<Map<String, Object>> checkNow(
            @RequestParam(required = false) Long spaceId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        alertService.triggerManualCheck(spaceId, currentUser.getId());
        return ResponseEntity.ok(Map.of("message", "Spending check completed", "status", "SUCCESS"));
    }
}

