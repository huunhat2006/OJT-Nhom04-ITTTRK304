// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.response.DashboardResponse;
import com.example.bton.dto.response.ReportResponse;
import com.example.bton.enums.TransactionType;
import com.example.bton.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl {

    private final TransactionRepository transactionRepository;
    private final BudgetServiceImpl budgetService;
    private final SavingsGoalServiceImpl savingsGoalService;
    private final FinancialSpaceServiceImpl spaceService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long spaceId, Long userId, int month, int year) {
        spaceService.verifySpaceAccess(spaceId, userId);

        BigDecimal totalIncome = transactionRepository
                .sumBySpaceAndTypeAndMonth(spaceId, TransactionType.INCOME, year, month);
        if (totalIncome == null) totalIncome = BigDecimal.ZERO;

        BigDecimal totalExpense = transactionRepository
                .sumBySpaceAndTypeAndMonth(spaceId, TransactionType.EXPENSE, year, month);
        if (totalExpense == null) totalExpense = BigDecimal.ZERO;

        BigDecimal balance = totalIncome.subtract(totalExpense);

        // Expense by category
        List<Object[]> rawCategoryExpenses = transactionRepository
                .findExpenseByCategory(spaceId, year, month);
        List<DashboardResponse.CategoryExpenseResponse> categoryExpenses = buildCategoryExpenses(
                rawCategoryExpenses, totalExpense);

        // Budgets with warnings
        var budgets = budgetService.getBudgets(spaceId, userId, month, year);
        var warnings = budgets.stream()
                .filter(b -> !"NORMAL".equals(b.getStatus()))
                .collect(Collectors.toList());

        // Savings goals
        var goals = savingsGoalService.getGoals(spaceId, userId);

        // Recent 10 transactions
        var recent = transactionRepository.findRecentBySpace(spaceId, PageRequest.of(0, 10));
        var recentResponses = recent.stream()
                .map(TransactionServiceImpl::mapToResponseStatic)
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .month(month)
                .year(year)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .expenseByCategory(categoryExpenses)
                .budgets(budgets)
                .budgetWarnings(warnings)
                .savingsGoals(goals)
                .recentTransactions(recentResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public ReportResponse getReport(Long spaceId, Long userId,
                                    LocalDate startDate, LocalDate endDate) {
        spaceService.verifySpaceAccess(spaceId, userId);

        List<Object[]> monthlyData = transactionRepository.findMonthlyTotals(spaceId, startDate, endDate);

        List<ReportResponse.MonthlySummary> summaries = new ArrayList<>();
        List<ReportResponse.TrendData> trends = new ArrayList<>();
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Object[] row : monthlyData) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            BigDecimal income = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
            BigDecimal expense = row[3] != null ? (BigDecimal) row[3] : BigDecimal.ZERO;

            totalIncome = totalIncome.add(income);
            totalExpense = totalExpense.add(expense);

            summaries.add(ReportResponse.MonthlySummary.builder()
                    .year(year).month(month).income(income)
                    .expense(expense).balance(income.subtract(expense)).build());

            trends.add(ReportResponse.TrendData.builder()
                    .label(year + "-" + String.format("%02d", month))
                    .income(income).expense(expense)
                    .balance(income.subtract(expense)).build());
        }

        // Expense by category for the whole period
        // Query most recent month for category breakdown
        List<Object[]> rawCategoryExpenses = transactionRepository.findExpenseByCategory(
                spaceId, endDate.getYear(), endDate.getMonthValue());
        List<ReportResponse.CategoryBreakdown> catBreakdowns = buildCategoryBreakdowns(
                rawCategoryExpenses, totalExpense);

        return ReportResponse.builder()
                .monthlySummaries(summaries)
                .trends(trends)
                .expenseByCategory(catBreakdowns)
                .incomeByCategory(List.of())
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .totalBalance(totalIncome.subtract(totalExpense))
                .build();
    }

    private List<DashboardResponse.CategoryExpenseResponse> buildCategoryExpenses(
            List<Object[]> rawData, BigDecimal totalExpense) {
        return rawData.stream().map(row -> {
            Long catId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String nameVi = (String) row[2];
            String color = (String) row[3];
            String icon = (String) row[4];
            BigDecimal amount = (BigDecimal) row[5];
            BigDecimal pct = totalExpense.compareTo(BigDecimal.ZERO) > 0
                    ? amount.multiply(new BigDecimal("100"))
                    .divide(totalExpense, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return DashboardResponse.CategoryExpenseResponse.builder()
                    .categoryId(catId).categoryName(name).categoryNameVi(nameVi)
                    .color(color).icon(icon).amount(amount).percentage(pct).build();
        }).collect(Collectors.toList());
    }

    private List<ReportResponse.CategoryBreakdown> buildCategoryBreakdowns(
            List<Object[]> rawData, BigDecimal totalExpense) {
        return rawData.stream().map(row -> {
            Long catId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String nameVi = (String) row[2];
            String color = (String) row[3];
            String icon = (String) row[4];
            BigDecimal amount = (BigDecimal) row[5];
            BigDecimal pct = totalExpense.compareTo(BigDecimal.ZERO) > 0
                    ? amount.multiply(new BigDecimal("100"))
                    .divide(totalExpense, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return ReportResponse.CategoryBreakdown.builder()
                    .categoryId(catId).categoryName(name).categoryNameVi(nameVi)
                    .color(color).icon(icon).amount(amount).percentage(pct).build();
        }).collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public byte[] exportTransactionsToExcel(Long spaceId, Long userId, LocalDate startDate, LocalDate endDate) {
        spaceService.verifySpaceAccess(spaceId, userId);

        var transactions = transactionRepository.findForExport(spaceId, startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Sổ Thu Chi");

            // Style: Header chính
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            // Style: Subtitle
            CellStyle subTitleStyle = workbook.createCellStyle();
            Font subTitleFont = workbook.createFont();
            subTitleFont.setItalic(true);
            subTitleFont.setFontHeightInPoints((short) 10);
            subTitleStyle.setFont(subTitleFont);
            subTitleStyle.setAlignment(HorizontalAlignment.CENTER);

            // Style: Header cột
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Style: Data cells
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            // Style: Currency
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.cloneStyleFrom(dataStyle);
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0 ₫"));
            currencyStyle.setAlignment(HorizontalAlignment.RIGHT);

            // Style: Center
            CellStyle centerStyle = workbook.createCellStyle();
            centerStyle.cloneStyleFrom(dataStyle);
            centerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Dòng 1: Tiêu đề
            Row rowTitle = sheet.createRow(1);
            Cell cellTitle = rowTitle.createCell(0);
            cellTitle.setCellValue("BÁO CÁO KÊ KHAI THU CHI VÀ BIẾN ĐỘNG SỐ DƯ");
            cellTitle.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 6));

            // Dòng 2: Thời gian xuất
            Row rowSub = sheet.createRow(2);
            Cell cellSub = rowSub.createCell(0);
            String timeRange = (startDate != null && endDate != null)
                    ? String.format("Khoảng thời gian: %s đến %s", startDate, endDate)
                    : "Toàn bộ lịch sử giao dịch tính đến thời điểm hiện tại";
            cellSub.setCellValue(timeRange);
            cellSub.setCellStyle(subTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, 6));

            // Dòng 4: Tiêu đề bảng
            String[] headers = {"Mã GD", "Ngày Phát Sinh", "Loại", "Danh Mục", "Số Tiền", "Người Thực Hiện", "Ghi Chú"};
            Row rowHeader = sheet.createRow(4);
            rowHeader.setHeightInPoints(26);
            for (int i = 0; i < headers.length; i++) {
                Cell c = rowHeader.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            // Dữ liệu
            int rowIdx = 5;
            BigDecimal totalIncome = BigDecimal.ZERO;
            BigDecimal totalExpense = BigDecimal.ZERO;

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

            for (var t : transactions) {
                Row row = sheet.createRow(rowIdx++);
                Cell c0 = row.createCell(0);
                c0.setCellValue(t.getId() != null ? "GD-" + String.format("%05d", t.getId()) : "-");
                c0.setCellStyle(centerStyle);

                Cell c1 = row.createCell(1);
                c1.setCellValue(t.getTransactionDate() != null ? t.getTransactionDate().format(dtf) : "-");
                c1.setCellStyle(centerStyle);

                Cell c2 = row.createCell(2);
                String typeStr = switch (t.getType()) {
                    case INCOME -> "Thu nhập";
                    case EXPENSE -> "Chi tiêu";
                    case TRANSFER -> "Chuyển khoản";
                };
                c2.setCellValue(typeStr);
                c2.setCellStyle(centerStyle);

                Cell c3 = row.createCell(3);
                String catName = t.getCategory() != null ? (t.getCategory().getNameVi() != null ? t.getCategory().getNameVi() : t.getCategory().getName()) : "-";
                c3.setCellValue(catName);
                c3.setCellStyle(dataStyle);

                Cell c4 = row.createCell(4);
                double amountVal = t.getAmount() != null ? t.getAmount().doubleValue() : 0.0;
                c4.setCellValue(amountVal);
                c4.setCellStyle(currencyStyle);

                if (t.getType() == TransactionType.INCOME && t.getAmount() != null) {
                    totalIncome = totalIncome.add(t.getAmount());
                } else if (t.getType() == TransactionType.EXPENSE && t.getAmount() != null) {
                    totalExpense = totalExpense.add(t.getAmount());
                }

                Cell c5 = row.createCell(5);
                c5.setCellValue(t.getUser() != null ? t.getUser().getFullName() : "-");
                c5.setCellStyle(dataStyle);

                Cell c6 = row.createCell(6);
                String note = t.getDescription() != null ? t.getDescription() : (t.getNote() != null ? t.getNote() : "");
                c6.setCellValue(note);
                c6.setCellStyle(dataStyle);
            }

            // Dòng tổng kết
            Row rowSumIncome = sheet.createRow(rowIdx++);
            Cell cSumInLabel = rowSumIncome.createCell(3);
            cSumInLabel.setCellValue("TỔNG THU NHẬP:");
            cSumInLabel.setCellStyle(headerStyle);
            Cell cSumInVal = rowSumIncome.createCell(4);
            cSumInVal.setCellValue(totalIncome.doubleValue());
            cSumInVal.setCellStyle(currencyStyle);

            Row rowSumExpense = sheet.createRow(rowIdx++);
            Cell cSumOutLabel = rowSumExpense.createCell(3);
            cSumOutLabel.setCellValue("TỔNG CHI TIÊU:");
            cSumOutLabel.setCellStyle(headerStyle);
            Cell cSumOutVal = rowSumExpense.createCell(4);
            cSumOutVal.setCellValue(totalExpense.doubleValue());
            cSumOutVal.setCellStyle(currencyStyle);

            Row rowBalance = sheet.createRow(rowIdx++);
            Cell cBalLabel = rowBalance.createCell(3);
            cBalLabel.setCellValue("CHÊNH LỆCH DÒNG TIỀN:");
            cBalLabel.setCellStyle(headerStyle);
            Cell cBalVal = rowBalance.createCell(4);
            cBalVal.setCellValue(totalIncome.subtract(totalExpense).doubleValue());
            cBalVal.setCellStyle(currencyStyle);

            // Auto-fit độ rộng cột
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.max(sheet.getColumnWidth(i) + 1200, 3500));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi xuất tệp Excel báo cáo: " + e.getMessage(), e);
        }
    }
}
