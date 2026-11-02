// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.request.WalletRequest;
import com.example.bton.dto.request.WalletTransferRequest;
import com.example.bton.dto.response.WalletResponse;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.impl.WalletServiceImpl;
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
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
@Tag(name = "Wallets", description = "Money wallet management (UC03)")
@SecurityRequirement(name = "bearerAuth")
public class WalletController {

    private final WalletServiceImpl walletService;

    @GetMapping
    @Operation(summary = "Get all wallets for current user, optionally filtered by space")
    public ResponseEntity<List<WalletResponse>> getWallets(
            @RequestParam(required = false) Long spaceId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(walletService.getWallets(currentUser.getId(), spaceId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get wallet by ID")
    public ResponseEntity<WalletResponse> getWallet(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(walletService.getWalletById(id, currentUser.getId()));
    }

    @PostMapping
    @Operation(summary = "Create a new wallet")
    public ResponseEntity<WalletResponse> createWallet(
            @Valid @RequestBody WalletRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(walletService.createWallet(currentUser.getId(), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a wallet")
    public ResponseEntity<WalletResponse> updateWallet(
            @PathVariable Long id,
            @Valid @RequestBody WalletRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(walletService.updateWallet(id, currentUser.getId(), request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a wallet (only if no transactions)")
    public ResponseEntity<Void> deleteWallet(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        walletService.deleteWallet(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/archive")
    @Operation(summary = "Archive a wallet (soft delete)")
    public ResponseEntity<WalletResponse> archiveWallet(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(walletService.archiveWallet(id, currentUser.getId()));
    }

    @PostMapping("/transfer")
    @Operation(summary = "Transfer money between wallets (UC04)")
    public ResponseEntity<WalletResponse> transfer(
            @Valid @RequestBody WalletTransferRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(walletService.transferBetweenWallets(currentUser.getId(), request));
    }
}
