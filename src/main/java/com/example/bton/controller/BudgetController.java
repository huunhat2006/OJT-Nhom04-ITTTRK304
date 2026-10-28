// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.request.BudgetRequest;
import com.example.bton.dto.response.BudgetResponse;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.impl.BudgetServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Monthly budget management")
@SecurityRequirement(name = "bearerAuth")
public class BudgetController {

    private final BudgetServiceImpl budgetService;

    @GetMapping
    @Operation(summary = "Get budgets for a space and month/year")
    public ResponseEntity<List<BudgetResponse>> getBudgets(
            @RequestParam Long spaceId,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (month == 0) month = LocalDate.now().getMonthValue();
        if (year == 0) year = LocalDate.now().getYear();
        return ResponseEntity.ok(budgetService.getBudgets(spaceId, currentUser.getId(), month, year));
    }

    @PostMapping
    @Operation(summary = "Create a monthly budget for a category")
    public ResponseEntity<BudgetResponse> createBudget(
            @Valid @RequestBody BudgetRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(budgetService.createBudget(currentUser.getId(), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a budget amount")
    public ResponseEntity<BudgetResponse> updateBudget(
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(budgetService.updateBudget(id, currentUser.getId(), request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a budget")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        budgetService.deleteBudget(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
