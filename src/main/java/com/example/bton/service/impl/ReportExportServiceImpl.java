// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.Transaction;
import com.example.bton.entity.User;
import com.example.bton.service.ReportExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportExportServiceImpl implements ReportExportService {

    private final PdfReportGenerator pdfReportGenerator;
    private final ExcelReportGenerator excelReportGenerator;

    @Override
    public byte[] exportToPdf(User user, FinancialSpace space, List<Transaction> transactions, LocalDate from, LocalDate to) {
        return pdfReportGenerator.generatePdf(user, space, transactions, from, to);
    }

    @Override
    public byte[] exportToExcel(User user, FinancialSpace space, List<Transaction> transactions, LocalDate from, LocalDate to) {
        return excelReportGenerator.generateExcel(user, space, transactions, from, to);
    }
}
