// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.Transaction;
import com.example.bton.entity.User;
import com.example.bton.enums.TransactionType;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
public class ExcelReportGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public byte[] generateExcel(User user, FinancialSpace space, List<Transaction> transactions, LocalDate from, LocalDate to) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Calculations
            BigDecimal totalIncome = BigDecimal.ZERO;
            BigDecimal totalExpense = BigDecimal.ZERO;
            for (Transaction t : transactions) {
                if (t.getType() == TransactionType.INCOME) {
                    totalIncome = totalIncome.add(t.getAmount());
                } else if (t.getType() == TransactionType.EXPENSE) {
                    totalExpense = totalExpense.add(t.getAmount());
                }
            }
            BigDecimal netBalance = totalIncome.subtract(totalExpense);

            // Styles
            DataFormat dataFormat = workbook.createDataFormat();

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle metaStyle = workbook.createCellStyle();
            Font metaFont = workbook.createFont();
            metaFont.setFontHeightInPoints((short) 10);
            metaFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            metaStyle.setFont(metaFont);
            metaStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setThinBorders(headerStyle);

            CellStyle sectionHeaderStyle = workbook.createCellStyle();
            Font sectionFont = workbook.createFont();
            sectionFont.setBold(true);
            sectionFont.setFontHeightInPoints((short) 12);
            sectionFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            sectionHeaderStyle.setFont(sectionFont);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setThinBorders(dataStyle);

            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.cloneStyleFrom(dataStyle);
            dateStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.cloneStyleFrom(dataStyle);
            currencyStyle.setDataFormat(dataFormat.getFormat("#,##0 ₫"));
            currencyStyle.setAlignment(HorizontalAlignment.RIGHT);

            CellStyle incomeStyle = workbook.createCellStyle();
            incomeStyle.cloneStyleFrom(dataStyle);
            Font incFont = workbook.createFont();
            incFont.setBold(true);
            incFont.setColor(IndexedColors.GREEN.getIndex());
            incomeStyle.setFont(incFont);
            incomeStyle.setDataFormat(dataFormat.getFormat("#,##0 ₫"));
            incomeStyle.setAlignment(HorizontalAlignment.RIGHT);

            CellStyle expenseStyle = workbook.createCellStyle();
            expenseStyle.cloneStyleFrom(dataStyle);
            Font expFont = workbook.createFont();
            expFont.setBold(true);
            expFont.setColor(IndexedColors.RED.getIndex());
            expenseStyle.setFont(expFont);
            expenseStyle.setDataFormat(dataFormat.getFormat("#,##0 ₫"));
            expenseStyle.setAlignment(HorizontalAlignment.RIGHT);

            // -------------------------------------------------------------
            // SHEET 1: TỔNG QUAN & DANH MỤC
            // -------------------------------------------------------------
            Sheet sheet1 = workbook.createSheet("Tổng quan & Danh mục");

            Row r0 = sheet1.createRow(0);
            Cell c0 = r0.createCell(0);
            c0.setCellValue("BÁO CÁO TỔNG HỢP THU CHI TÀI CHÍNH");
            c0.setCellStyle(titleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            Row r1 = sheet1.createRow(1);
            Cell c1 = r1.createCell(0);
            String timeRangeStr = "Thời gian: " + (from != null ? from.format(DATE_FORMATTER) : "Khởi tạo")
                    + " đến " + (to != null ? to.format(DATE_FORMATTER) : "Hiện tại")
                    + "   |   Ngày xuất: " + LocalDateTime.now().format(DATETIME_FORMATTER);
            c1.setCellValue(timeRangeStr);
            c1.setCellStyle(metaStyle);
            sheet1.addMergedRegion(new CellRangeAddress(1, 1, 0, 5));

            String userName = (user != null && user.getFullName() != null && !user.getFullName().isBlank()) ? user.getFullName() : (user != null ? user.getUsername() : "N/A");
            String spaceName = space != null ? space.getName() : "Không gian cá nhân";

            Row r3 = sheet1.createRow(3);
            r3.createCell(0).setCellValue("Người xuất:");
            r3.createCell(1).setCellValue(userName);
            r3.createCell(3).setCellValue("Không gian:");
            r3.createCell(4).setCellValue(spaceName);

            // KPI Table
            Row rKpiH = sheet1.createRow(5);
            Cell ck1 = rKpiH.createCell(1); ck1.setCellValue("TỔNG THU NHẬP"); ck1.setCellStyle(headerStyle);
            Cell ck2 = rKpiH.createCell(2); ck2.setCellValue("TỔNG CHI TIÊU"); ck2.setCellStyle(headerStyle);
            Cell ck3 = rKpiH.createCell(3); ck3.setCellValue("SỐ DƯ CUỐI KỲ"); ck3.setCellStyle(headerStyle);

            Row rKpiV = sheet1.createRow(6);
            rKpiV.setHeightInPoints(24);
            Cell cv1 = rKpiV.createCell(1); cv1.setCellValue(totalIncome.doubleValue()); cv1.setCellStyle(incomeStyle);
            Cell cv2 = rKpiV.createCell(2); cv2.setCellValue(totalExpense.doubleValue()); cv2.setCellStyle(expenseStyle);
            Cell cv3 = rKpiV.createCell(3); cv3.setCellValue(netBalance.doubleValue());
            cv3.setCellStyle(netBalance.compareTo(BigDecimal.ZERO) >= 0 ? incomeStyle : expenseStyle);

            // Category Breakdown Section
            Row rCatTitle = sheet1.createRow(8);
            Cell cCatT = rCatTitle.createCell(0);
            cCatT.setCellValue("BẢNG TỔNG HỢP THEO DANH MỤC");
            cCatT.setCellStyle(sectionHeaderStyle);

            String[] catHeaders = {"STT", "Tên danh mục", "Phân loại", "Tổng số tiền", "Tỷ lệ (%)"};
            Row rCatHead = sheet1.createRow(9);
            rCatHead.setHeightInPoints(22);
            for (int i = 0; i < catHeaders.length; i++) {
                Cell cell = rCatHead.createCell(i);
                cell.setCellValue(catHeaders[i]);
                cell.setCellStyle(headerStyle);
            }

            Map<String, CategoryAggregation> catMap = aggregateCategories(transactions, totalIncome, totalExpense);
            int catRowIdx = 10;
            int catStt = 1;
            for (CategoryAggregation ca : catMap.values()) {
                Row row = sheet1.createRow(catRowIdx++);
                Cell c_stt = row.createCell(0); c_stt.setCellValue(catStt++); c_stt.setCellStyle(dateStyle);
                Cell c_name = row.createCell(1); c_name.setCellValue(ca.name); c_name.setCellStyle(dataStyle);
                Cell c_type = row.createCell(2); c_type.setCellValue(ca.typeLabel); c_type.setCellStyle(dateStyle);
                Cell c_amt = row.createCell(3); c_amt.setCellValue(ca.totalAmount.doubleValue());
                c_amt.setCellStyle(ca.isIncome ? incomeStyle : expenseStyle);
                Cell c_pct = row.createCell(4); c_pct.setCellValue(String.format("%.1f%%", ca.percentage)); c_pct.setCellStyle(dateStyle);
            }

            for (int i = 0; i < 5; i++) {
                sheet1.autoSizeColumn(i);
                sheet1.setColumnWidth(i, Math.max(sheet1.getColumnWidth(i) + 1200, 4200));
            }

            // -------------------------------------------------------------
            // SHEET 2: CHI TIẾT GIAO DỊCH
            // -------------------------------------------------------------
            Sheet sheet2 = workbook.createSheet("Chi tiết giao dịch");

            Row rTxTitle = sheet2.createRow(0);
            Cell cTxT = rTxTitle.createCell(0);
            cTxT.setCellValue("DANH SÁCH CHI TIẾT CÁC GIAO DỊCH");
            cTxT.setCellStyle(sectionHeaderStyle);

            String[] txHeaders = {"STT", "Ngày giao dịch", "Loại", "Danh mục", "Ví thanh toán", "Người thực hiện", "Số tiền", "Ghi chú"};
            Row rTxHead = sheet2.createRow(2);
            rTxHead.setHeightInPoints(24);
            for (int i = 0; i < txHeaders.length; i++) {
                Cell cell = rTxHead.createCell(i);
                cell.setCellValue(txHeaders[i]);
                cell.setCellStyle(headerStyle);
            }

            int txRowIdx = 3;
            int txStt = 1;
            for (Transaction t : transactions) {
                Row row = sheet2.createRow(txRowIdx++);
                row.setHeightInPoints(20);

                Cell c_stt = row.createCell(0); c_stt.setCellValue(txStt++); c_stt.setCellStyle(dateStyle);
                Cell c_date = row.createCell(1);
                c_date.setCellValue(t.getTransactionDate() != null ? t.getTransactionDate().format(DATE_FORMATTER) : "-");
                c_date.setCellStyle(dateStyle);

                Cell c_type = row.createCell(2);
                c_type.setCellValue(t.getType() == TransactionType.INCOME ? "Thu nhập" : (t.getType() == TransactionType.EXPENSE ? "Chi tiêu" : "Chuyển tiền"));
                c_type.setCellStyle(dateStyle);

                Cell c_cat = row.createCell(3);
                c_cat.setCellValue(t.getCategory() != null ? (t.getCategory().getNameVi() != null ? t.getCategory().getNameVi() : t.getCategory().getName()) : "Khác");
                c_cat.setCellStyle(dataStyle);

                Cell c_wallet = row.createCell(4);
                c_wallet.setCellValue(t.getWallet() != null ? t.getWallet().getName() : "-");
                c_wallet.setCellStyle(dataStyle);

                Cell c_usr = row.createCell(5);
                c_usr.setCellValue(t.getUser() != null ? (t.getUser().getFullName() != null ? t.getUser().getFullName() : t.getUser().getUsername()) : "-");
                c_usr.setCellStyle(dataStyle);

                Cell c_amt = row.createCell(6);
                c_amt.setCellValue(t.getAmount().doubleValue());
                if (t.getType() == TransactionType.INCOME) {
                    c_amt.setCellStyle(incomeStyle);
                } else if (t.getType() == TransactionType.EXPENSE) {
                    c_amt.setCellStyle(expenseStyle);
                } else {
                    c_amt.setCellStyle(currencyStyle);
                }

                Cell c_note = row.createCell(7);
                String note = t.getDescription() != null ? t.getDescription() : (t.getNote() != null ? t.getNote() : "");
                c_note.setCellValue(note);
                c_note.setCellStyle(dataStyle);
            }

            // Summary row in sheet 2
            Row rSum = sheet2.createRow(txRowIdx + 1);
            Cell cSumLbl = rSum.createCell(5);
            cSumLbl.setCellValue("SỐ DƯ CUỐI KỲ:");
            cSumLbl.setCellStyle(headerStyle);
            Cell cSumVal = rSum.createCell(6);
            cSumVal.setCellValue(netBalance.doubleValue());
            cSumVal.setCellStyle(netBalance.compareTo(BigDecimal.ZERO) >= 0 ? incomeStyle : expenseStyle);

            for (int i = 0; i < txHeaders.length; i++) {
                sheet2.autoSizeColumn(i);
                sheet2.setColumnWidth(i, Math.max(sheet2.getColumnWidth(i) + 1200, 3600));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi khi xuất tệp Excel báo cáo: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi xuất tệp Excel báo cáo: " + e.getMessage(), e);
        }
    }

    private void setThinBorders(CellStyle style) {
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
    }

    private Map<String, CategoryAggregation> aggregateCategories(List<Transaction> transactions, BigDecimal totalIncome, BigDecimal totalExpense) {
        Map<String, CategoryAggregation> map = new LinkedHashMap<>();
        for (Transaction t : transactions) {
            String catName = t.getCategory() != null ? (t.getCategory().getNameVi() != null ? t.getCategory().getNameVi() : t.getCategory().getName()) : "Khác";
            String key = catName + "_" + t.getType();
            CategoryAggregation ca = map.computeIfAbsent(key, k -> {
                CategoryAggregation agg = new CategoryAggregation();
                agg.name = catName;
                agg.type = t.getType();
                agg.isIncome = (t.getType() == TransactionType.INCOME);
                agg.typeLabel = agg.isIncome ? "Thu nhập" : (t.getType() == TransactionType.EXPENSE ? "Chi tiêu" : "Chuyển tiền");
                agg.totalAmount = BigDecimal.ZERO;
                return agg;
            });
            ca.totalAmount = ca.totalAmount.add(t.getAmount());
        }

        for (CategoryAggregation ca : map.values()) {
            BigDecimal base = ca.isIncome ? totalIncome : totalExpense;
            if (base != null && base.compareTo(BigDecimal.ZERO) > 0) {
                ca.percentage = ca.totalAmount.divide(base, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();
            } else {
                ca.percentage = 0.0;
            }
        }
        return map;
    }

    private static class CategoryAggregation {
        String name;
        TransactionType type;
        boolean isIncome;
        String typeLabel;
        BigDecimal totalAmount;
        double percentage;
    }
}
