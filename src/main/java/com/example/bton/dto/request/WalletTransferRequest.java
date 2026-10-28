// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class WalletTransferRequest {

    @NotNull(message = "Source wallet ID is required")
    private Long fromWalletId;

    @NotNull(message = "Destination wallet ID is required")
    private Long toWalletId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 13, fraction = 2, message = "Amount format is invalid")
    private BigDecimal amount;

    @DecimalMin(value = "0", message = "Fee must not be negative")
    @Digits(integer = 13, fraction = 2, message = "Fee format is invalid")
    private BigDecimal fee;

    @Size(max = 500, message = "Note must not exceed 500 characters")
    private String note;

    private Long spaceId;
}
