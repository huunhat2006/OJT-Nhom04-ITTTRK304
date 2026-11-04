// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service;

import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.Transaction;
import com.example.bton.entity.User;

import java.time.LocalDate;
import java.util.List;

public interface ReportExportService {

    /**
     * Xuất báo cáo tài chính dạng PDF (iText 7 + biểu đồ JFreeChart).
     */
    byte[] exportToPdf(User user, FinancialSpace space, List<Transaction> transactions, LocalDate from, LocalDate to);

    /**
     * Xuất báo cáo tài chính dạng Excel (Apache POI).
     */
    byte[] exportToExcel(User user, FinancialSpace space, List<Transaction> transactions, LocalDate from, LocalDate to);
}
