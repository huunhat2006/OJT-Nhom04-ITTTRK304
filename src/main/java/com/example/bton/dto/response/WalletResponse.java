// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import com.example.bton.enums.WalletType;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class WalletResponse {
    private Long id;
    private Long userId;
    private Long spaceId;
    private String name;
    private WalletType walletType;
    private String currency;
    private BigDecimal balance;
    private Boolean isShared;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
