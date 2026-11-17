package com.example.bton.service.impl;

import com.example.bton.service.RecurringTransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionScheduler {

    private final RecurringTransactionService recurringTransactionService;

    // Chạy khi ứng dụng khởi động và định kỳ mỗi 15 phút để tự động thực hiện các giao dịch đến hạn
    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 0/15 * * * *")
    public void executeDueRecurringTransactions() {
        List<Long> dueIds = recurringTransactionService.findDueRecurringIds();
        if (dueIds.isEmpty()) {
            return;
        }

        log.info("Recurring transaction scheduler started for {} due record(s)", dueIds.size());
        int success = 0;
        int failed = 0;
        for (Long id : dueIds) {
            try {
                if (recurringTransactionService.executeDueRecurring(id)) {
                    success++;
                } else {
                    failed++;
                }
            } catch (Exception e) {
                failed++;
                log.error("Unexpected error while executing recurring transaction {}", id, e);
            }
        }
        log.info("Recurring transaction scheduler finished: {} success, {} skipped/failed",
                success, failed);
    }
}
