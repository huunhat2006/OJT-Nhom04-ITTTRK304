// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.request.CategoryRequest;
import com.example.bton.dto.response.*;
import com.example.bton.enums.Role;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.impl.AdminServiceImpl;
import com.example.bton.service.impl.CategoryServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Administrator management endpoints")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminServiceImpl adminService;
    private final CategoryServiceImpl categoryService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard statistics")
    public ResponseEntity<AdminDashboardResponse> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }

    @GetMapping("/users")
    @Operation(summary = "Search and filter users with pagination")
    public ResponseEntity<PageResponse<UserResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.searchUsers(keyword, role, isActive, page, size));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get user details by ID")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PatchMapping("/users/{id}/toggle-status")
    @Operation(summary = "Enable or disable a user account")
    public ResponseEntity<UserResponse> toggleUserStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(adminService.toggleUserStatus(id, currentUser.getId()));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all system categories")
    public ResponseEntity<List<CategoryResponse>> getSystemCategories() {
        return ResponseEntity.ok(categoryService.getSystemCategories());
    }

    @PostMapping("/categories")
    @Operation(summary = "Create a system category")
    public ResponseEntity<CategoryResponse> createSystemCategory(
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CategoryResponse response = categoryService.adminCreateCategory(request);
        adminService.saveAuditLog(currentUser.getId(), "CREATE_CATEGORY", "Category",
                response.getId(), "Created system category: " + request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update a system category")
    public ResponseEntity<CategoryResponse> updateSystemCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CategoryResponse response = categoryService.adminUpdateCategory(id, request);
        adminService.saveAuditLog(currentUser.getId(), "UPDATE_CATEGORY", "Category",
                id, "Updated category: " + request.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/categories/{id}/toggle")
    @Operation(summary = "Enable or disable a system category")
    public ResponseEntity<Void> toggleCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        categoryService.adminToggleCategory(id);
        adminService.saveAuditLog(currentUser.getId(), "TOGGLE_CATEGORY", "Category",
                id, "Toggled category status");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get admin audit logs")
    public ResponseEntity<PageResponse<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) Long adminId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAuditLogs(adminId, action, page, size));
    }
}
