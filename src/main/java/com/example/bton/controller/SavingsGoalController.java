// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.request.SavingsGoalRequest;
import com.example.bton.dto.request.UpdateSavingsAmountRequest;
import com.example.bton.dto.response.SavingsGoalResponse;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.impl.SavingsGoalServiceImpl;
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
@RequestMapping("/api/v1/savings-goals")
@RequiredArgsConstructor
@Tag(name = "Savings Goals", description = "Financial savings goal tracking")
@SecurityRequirement(name = "bearerAuth")
public class SavingsGoalController {

    private final SavingsGoalServiceImpl savingsGoalService;

    @GetMapping
    @Operation(summary = "Get all savings goals for a space")
    public ResponseEntity<List<SavingsGoalResponse>> getGoals(
            @RequestParam Long spaceId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(savingsGoalService.getGoals(spaceId, currentUser.getId()));
    }

    @PostMapping
    @Operation(summary = "Create a savings goal")
    public ResponseEntity<SavingsGoalResponse> createGoal(
            @Valid @RequestBody SavingsGoalRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savingsGoalService.createGoal(currentUser.getId(), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get savings goal by ID")
    public ResponseEntity<SavingsGoalResponse> getGoal(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(savingsGoalService.getGoalById(id, currentUser.getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a savings goal")
    public ResponseEntity<SavingsGoalResponse> updateGoal(
            @PathVariable Long id,
            @Valid @RequestBody SavingsGoalRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(savingsGoalService.updateGoal(id, currentUser.getId(), request));
    }

    @PatchMapping("/{id}/amount")
    @Operation(summary = "Update current saved amount for a goal")
    public ResponseEntity<SavingsGoalResponse> updateAmount(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSavingsAmountRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                savingsGoalService.updateCurrentAmount(id, currentUser.getId(), request));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel a savings goal")
    public ResponseEntity<Void> cancelGoal(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        savingsGoalService.cancelGoal(id, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a savings goal")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        savingsGoalService.deleteGoal(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
