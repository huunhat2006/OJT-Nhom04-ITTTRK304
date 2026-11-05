package com.example.bton.controller;

import com.example.bton.dto.request.RecurringTransactionRequest;
import com.example.bton.dto.response.PageResponse;
import com.example.bton.dto.response.RecurringTransactionResponse;
import com.example.bton.dto.response.RecurringTransactionRunResponse;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.RecurringTransactionService;
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
@RequestMapping({"/api/v1/recurring-transactions", "/api/recurring-transactions"})
@RequiredArgsConstructor
@Tag(name = "Recurring Transactions", description = "Automatically scheduled income/expense transactions")
@SecurityRequirement(name = "bearerAuth")
public class RecurringTransactionController {

    private final RecurringTransactionService recurringTransactionService;

    @GetMapping
    @Operation(summary = "List recurring transactions by space or current user")
    public ResponseEntity<List<RecurringTransactionResponse>> getRecurringTransactions(
            @RequestParam(required = false) Long spaceId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                recurringTransactionService.getRecurringTransactions(currentUser.getId(), spaceId));
    }

    @PostMapping
    @Operation(summary = "Create a recurring transaction")
    public ResponseEntity<RecurringTransactionResponse> createRecurringTransaction(
            @Valid @RequestBody RecurringTransactionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recurringTransactionService.createRecurringTransaction(currentUser.getId(), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a recurring transaction by ID")
    public ResponseEntity<RecurringTransactionResponse> getRecurringTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                recurringTransactionService.getRecurringTransaction(id, currentUser.getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a recurring transaction")
    public ResponseEntity<RecurringTransactionResponse> updateRecurringTransaction(
            @PathVariable Long id,
            @Valid @RequestBody RecurringTransactionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                recurringTransactionService.updateRecurringTransaction(id, currentUser.getId(), request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a recurring transaction")
    public ResponseEntity<Void> deleteRecurringTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        recurringTransactionService.deleteRecurringTransaction(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/pause")
    @Operation(summary = "Pause a recurring transaction")
    public ResponseEntity<RecurringTransactionResponse> pauseRecurringTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                recurringTransactionService.pauseRecurringTransaction(id, currentUser.getId()));
    }

    @PutMapping("/{id}/resume")
    @Operation(summary = "Resume a paused recurring transaction")
    public ResponseEntity<RecurringTransactionResponse> resumeRecurringTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                recurringTransactionService.resumeRecurringTransaction(id, currentUser.getId()));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get execution history of a recurring transaction")
    public ResponseEntity<PageResponse<RecurringTransactionRunResponse>> getHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                recurringTransactionService.getHistory(id, currentUser.getId(), page, size));
    }
}
