package com.example.bton.service;

import com.example.bton.dto.request.RecurringTransactionRequest;
import com.example.bton.dto.response.PageResponse;
import com.example.bton.dto.response.RecurringTransactionResponse;
import com.example.bton.dto.response.RecurringTransactionRunResponse;

import java.util.List;

public interface RecurringTransactionService {

    List<RecurringTransactionResponse> getRecurringTransactions(Long userId, Long spaceId);

    RecurringTransactionResponse getRecurringTransaction(Long id, Long userId);

    RecurringTransactionResponse createRecurringTransaction(Long userId, RecurringTransactionRequest request);

    RecurringTransactionResponse updateRecurringTransaction(Long id, Long userId, RecurringTransactionRequest request);

    void deleteRecurringTransaction(Long id, Long userId);

    RecurringTransactionResponse pauseRecurringTransaction(Long id, Long userId);

    RecurringTransactionResponse resumeRecurringTransaction(Long id, Long userId);

    PageResponse<RecurringTransactionRunResponse> getHistory(Long id, Long userId, int page, int size);

    List<Long> findDueRecurringIds();

    boolean executeDueRecurring(Long id);
}
