// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.request;

import com.example.bton.enums.WalletType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class WalletRequest {

    @NotBlank(message = "Wallet name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Wallet type is required")
    private WalletType walletType;

    @Size(max = 3, message = "Currency code must not exceed 3 characters")
    private String currency;

    @DecimalMin(value = "0", message = "Initial balance cannot be negative")
    @Digits(integer = 13, fraction = 2, message = "Amount format is invalid")
    private BigDecimal initialBalance;

    private Long spaceId;

    private Boolean isShared;
}
