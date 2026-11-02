// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.request.TransactionRequest;
import com.example.bton.dto.response.PageResponse;
import com.example.bton.dto.response.TransactionResponse;
import com.example.bton.enums.TransactionType;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.impl.TransactionServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Income and expense transaction management")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionServiceImpl transactionService;

    @GetMapping
    @Operation(summary = "List transactions with filters and pagination")
    public ResponseEntity<PageResponse<TransactionResponse>> getTransactions(
            @RequestParam Long spaceId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long walletId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(transactionService.getTransactions(
                spaceId, currentUser.getId(), type, categoryId, walletId,
                startDate, endDate, keyword, page, size));
    }

    @PostMapping
    @Operation(summary = "Create a new transaction")
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionService.createTransaction(currentUser.getId(), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID")
    public ResponseEntity<TransactionResponse> getTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(transactionService.getTransactionById(id, currentUser.getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a transaction")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(
                transactionService.updateTransaction(id, currentUser.getId(), request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a transaction")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        transactionService.deleteTransaction(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
