// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import com.example.bton.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TransactionResponse {
    private Long id;
    private Long spaceId;
    private String spaceName;
    private Long userId;
    private String userName;
    private CategoryResponse category;
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private LocalDate transactionDate;
    private String note;
    private String walletName;
    private String walletType;
    private String receiptUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
