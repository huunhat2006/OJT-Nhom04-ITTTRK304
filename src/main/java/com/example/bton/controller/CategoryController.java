// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.request.CategoryRequest;
import com.example.bton.dto.response.CategoryResponse;
import com.example.bton.enums.CategoryType;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.impl.CategoryServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Transaction category management")
@SecurityRequirement(name = "bearerAuth")
public class CategoryController {

    private final CategoryServiceImpl categoryService;

    @GetMapping
    @Operation(summary = "Get all available categories (system + user's own)")
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @RequestParam(required = false) CategoryType type,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (type != null) {
            return ResponseEntity.ok(categoryService.getCategoriesByType(currentUser.getId(), type));
        }
        return ResponseEntity.ok(categoryService.getAvailableCategories(currentUser.getId()));
    }

    @PostMapping
    @Operation(summary = "Create a custom category")
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.createCategory(currentUser.getId(), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a custom category")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(categoryService.updateCategory(id, currentUser.getId(), request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a custom category")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        categoryService.deleteCategory(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
