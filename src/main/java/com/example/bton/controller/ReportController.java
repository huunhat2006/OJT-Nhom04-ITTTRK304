// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.response.DashboardResponse;
import com.example.bton.dto.response.ReportResponse;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.impl.ReportServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Financial reports and statistics")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportServiceImpl reportService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard summary for a space and month")
    public ResponseEntity<DashboardResponse> getDashboard(
            @RequestParam Long spaceId,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (month == 0) month = LocalDate.now().getMonthValue();
        if (year == 0) year = LocalDate.now().getYear();
        return ResponseEntity.ok(
                reportService.getDashboard(spaceId, currentUser.getId(), month, year));
    }

    @GetMapping
    @Operation(summary = "Get financial report for a date range")
    public ResponseEntity<ReportResponse> getReport(
            @RequestParam Long spaceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                reportService.getReport(spaceId, currentUser.getId(), startDate, endDate));
    }

    @GetMapping("/export-excel")
    @Operation(summary = "Export financial transactions to Excel (.xlsx) file (UC13)")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam Long spaceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        byte[] excelData = reportService.exportTransactionsToExcel(spaceId, currentUser.getId(), startDate, endDate);
        String filename = "BaoCaoThuChi_" + LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelData);
    }
}
