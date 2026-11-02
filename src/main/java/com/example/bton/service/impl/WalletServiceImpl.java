// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.request.WalletRequest;
import com.example.bton.dto.request.WalletTransferRequest;
import com.example.bton.dto.response.WalletResponse;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.Transaction;
import com.example.bton.entity.User;
import com.example.bton.entity.Wallet;
import com.example.bton.enums.SpaceType;
import com.example.bton.enums.TransactionType;
import com.example.bton.enums.WalletType;
import com.example.bton.exception.AccessDeniedException;
import com.example.bton.exception.BadRequestException;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.TransactionRepository;
import com.example.bton.repository.UserRepository;
import com.example.bton.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final FinancialSpaceServiceImpl spaceService;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public List<WalletResponse> getWallets(Long userId, Long spaceId) {
        if (spaceId != null) {
            spaceService.verifySpaceAccess(spaceId, userId);
            return walletRepository.findBySpaceIdAndIsActiveTrue(spaceId)
                    .stream().map(this::mapToResponse).collect(Collectors.toList());
        }
        return walletRepository.findByUserIdAndIsActiveTrue(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WalletResponse getWalletById(Long walletId, Long userId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", walletId));
        if (!wallet.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You don't own this wallet");
        }
        if (wallet.getSpace() != null) {
            spaceService.verifySpaceAccess(wallet.getSpace().getId(), userId);
        }
        return mapToResponse(wallet);
    }

    @Transactional
    public WalletResponse createWallet(Long userId, WalletRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        FinancialSpace space = null;
        if (request.getSpaceId() != null) {
            space = spaceRepository.findByIdAndIsActiveTrue(request.getSpaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", request.getSpaceId()));
            spaceService.verifySpaceAccess(request.getSpaceId(), userId);
        }

        Wallet wallet = Wallet.builder()
                .user(user)
                .space(space)
                .name(request.getName())
                .walletType(request.getWalletType() != null ? request.getWalletType() : WalletType.CASH)
                .currency(request.getCurrency() != null ? request.getCurrency() : "VND")
                .balance(request.getInitialBalance() != null ? request.getInitialBalance() : BigDecimal.ZERO)
                .openingBalance(request.getInitialBalance() != null ? request.getInitialBalance() : BigDecimal.ZERO)
                .isShared(request.getIsShared() != null ? request.getIsShared() : false)
                .isActive(true)
                .build();

        wallet = walletRepository.save(wallet);

        return mapToResponse(wallet);
    }

    @Transactional
    public WalletResponse updateWallet(Long walletId, Long userId, WalletRequest request) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", walletId));
        if (!wallet.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You don't own this wallet");
        }
        if (wallet.getSpace() != null) {
            spaceService.verifySpaceAccess(wallet.getSpace().getId(), userId);
        }

        wallet.setName(request.getName());
        if (request.getWalletType() != null) wallet.setWalletType(request.getWalletType());
        if (request.getCurrency() != null) wallet.setCurrency(request.getCurrency());
        if (request.getIsShared() != null) wallet.setIsShared(request.getIsShared());

        wallet = walletRepository.save(wallet);
        return mapToResponse(wallet);
    }

    @Transactional
    public void deleteWallet(Long walletId, Long userId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", walletId));
        if (!wallet.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You don't own this wallet");
        }
        if (wallet.getSpace() != null) {
            spaceService.verifySpaceAccess(wallet.getSpace().getId(), userId);
        }

        // Check if wallet has transactions
        long txCount = transactionRepository.countByWalletId(walletId);
        if (txCount > 0) {
            throw new BadRequestException("Cannot delete wallet with existing transactions. Archive it instead.");
        }

        walletRepository.delete(wallet);
    }

    @Transactional
    public WalletResponse transferBetweenWallets(Long userId, WalletTransferRequest request) {
        Wallet fromWallet = walletRepository.findById(request.getFromWalletId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", request.getFromWalletId()));
        Wallet toWallet = walletRepository.findById(request.getToWalletId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", request.getToWalletId()));

        if (!fromWallet.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You don't own the source wallet");
        }
        if (!toWallet.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You don't own the destination wallet");
        }

        if (fromWallet.getId().equals(toWallet.getId())) {
            throw new BadRequestException("Source and destination wallets must be different");
        }

        BigDecimal amount = request.getAmount();
        BigDecimal fee = request.getFee() != null ? request.getFee() : BigDecimal.ZERO;
        BigDecimal totalDeduct = amount.add(fee);
        if (fromWallet.getBalance().compareTo(totalDeduct) < 0) {
            throw new BadRequestException("Số dư trong ví nguồn không đủ để thực hiện chuyển khoản (FIN-NB07)");
        }

        FinancialSpace space = null;
        if (request.getSpaceId() != null) {
            space = spaceRepository.findByIdAndIsActiveTrue(request.getSpaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", request.getSpaceId()));
            spaceService.verifySpaceAccess(request.getSpaceId(), userId);
        } else if (fromWallet.getSpace() != null) {
            space = fromWallet.getSpace();
        } else {
            space = spaceRepository.findFirstByOwnerIdAndTypeAndIsActiveTrue(userId, SpaceType.PERSONAL)
                    .orElseThrow(() -> new BadRequestException(
                            "Không tìm thấy không gian tài chính để ghi nhận giao dịch chuyển tiền"));
        }

        // Deduct from source wallet (amount + fee)
        fromWallet.setBalance(fromWallet.getBalance().subtract(totalDeduct));
        walletRepository.save(fromWallet);

        // Add to destination wallet
        toWallet.setBalance(toWallet.getBalance().add(amount));
        walletRepository.save(toWallet);

        // UC04: record a TRANSFER transaction linking both wallets
        Transaction transferTx = Transaction.builder()
                .space(space)
                .user(userRepository.findById(userId).orElseThrow())
                .category(null) // Transfer doesn't belong to an income/expense category
                .type(TransactionType.TRANSFER)
                .amount(amount)
                .description(request.getNote() != null ? request.getNote() : "Chuyển tiền nội bộ")
                .transactionDate(LocalDate.now())
                .wallet(fromWallet)
                .destinationWallet(toWallet)
                .isDeleted(false)
                .build();
        transactionRepository.save(transferTx);

        return WalletResponse.builder()
                .id(fromWallet.getId())
                .userId(fromWallet.getUser().getId())
                .spaceId(fromWallet.getSpace() != null ? fromWallet.getSpace().getId() : null)
                .name(fromWallet.getName())
                .walletType(fromWallet.getWalletType())
                .currency(fromWallet.getCurrency())
                .balance(fromWallet.getBalance())
                .isShared(fromWallet.getIsShared())
                .isActive(fromWallet.getIsActive())
                .createdAt(fromWallet.getCreatedAt())
                .updatedAt(fromWallet.getUpdatedAt())
                .build();
    }

    @Transactional
    public WalletResponse archiveWallet(Long walletId, Long userId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", walletId));
        if (!wallet.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You don't own this wallet");
        }
        wallet.setIsActive(false);
        wallet = walletRepository.save(wallet);
        return mapToResponse(wallet);
    }

    private WalletResponse mapToResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .userId(wallet.getUser().getId())
                .spaceId(wallet.getSpace() != null ? wallet.getSpace().getId() : null)
                .name(wallet.getName())
                .walletType(wallet.getWalletType())
                .currency(wallet.getCurrency())
                .balance(wallet.getBalance())
                .isShared(wallet.getIsShared())
                .isActive(wallet.getIsActive())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }
}
