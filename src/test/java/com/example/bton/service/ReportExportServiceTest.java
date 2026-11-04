// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service;

import com.example.bton.entity.*;
import com.example.bton.enums.CategoryType;
import com.example.bton.enums.SpaceType;
import com.example.bton.enums.TransactionType;
import com.example.bton.service.impl.ExcelReportGenerator;
import com.example.bton.service.impl.PdfReportGenerator;
import com.example.bton.service.impl.ReportExportServiceImpl;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReportExportServiceTest {

    private ReportExportServiceImpl exportService;
    private User testUser;
    private FinancialSpace testSpace;
    private List<Transaction> testTransactions;

    @BeforeEach
    void setUp() {
        exportService = new ReportExportServiceImpl(new PdfReportGenerator(), new ExcelReportGenerator());

        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .fullName("Trần Hữu Nhật")
                .email("nhat@example.com")
                .build();

        testSpace = FinancialSpace.builder()
                .id(10L)
                .name("Không gian cá nhân")
                .type(SpaceType.PERSONAL)
                .build();

        Category foodCat = Category.builder()
                .id(100L)
                .name("Ăn uống")
                .nameVi("Ăn uống")
                .type(CategoryType.EXPENSE)
                .build();

        Category salaryCat = Category.builder()
                .id(101L)
                .name("Lương")
                .nameVi("Tiền lương")
                .type(CategoryType.INCOME)
                .build();

        Wallet testWallet = Wallet.builder()
                .id(200L)
                .name("Ví Tiền Mặt")
                .build();

        Transaction t1 = Transaction.builder()
                .id(1001L)
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("15000000.00"))
                .transactionDate(LocalDate.now().minusDays(5))
                .category(salaryCat)
                .wallet(testWallet)
                .user(testUser)
                .space(testSpace)
                .description("Lương tháng")
                .isDeleted(false)
                .build();

        Transaction t2 = Transaction.builder()
                .id(1002L)
                .type(TransactionType.EXPENSE)
                .amount(new BigDecimal("350000.00"))
                .transactionDate(LocalDate.now().minusDays(2))
                .category(foodCat)
                .wallet(testWallet)
                .user(testUser)
                .space(testSpace)
                .description("Đi ăn cùng bạn bè")
                .isDeleted(false)
                .build();

        testTransactions = List.of(t1, t2);
    }

    @Test
    @DisplayName("PDF Export should generate valid PDF with %PDF header and non-empty content")
    void testExportToPdf_Success() {
        byte[] pdfBytes = exportService.exportToPdf(
                testUser, testSpace, testTransactions,
                LocalDate.now().minusMonths(1), LocalDate.now()
        );

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "PDF byte array should have sufficient length");

        // Verify PDF Magic Bytes (%PDF)
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }

    @Test
    @DisplayName("PDF Export should handle empty transactions list gracefully")
    void testExportToPdf_EmptyTransactions() {
        byte[] pdfBytes = exportService.exportToPdf(
                testUser, testSpace, List.of(),
                LocalDate.now().minusMonths(1), LocalDate.now()
        );

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
        assertEquals('%', (char) pdfBytes[0]);
    }

    @Test
    @DisplayName("Excel Export should generate valid XLSX with 2 sheets (Overview & Details)")
    void testExportToExcel_Success() throws Exception {
        byte[] excelBytes = exportService.exportToExcel(
                testUser, testSpace, testTransactions,
                LocalDate.now().minusMonths(1), LocalDate.now()
        );

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 1000, "Excel byte array should have sufficient length");

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            assertEquals(2, wb.getNumberOfSheets());
            assertEquals("Tổng quan & Danh mục", wb.getSheetAt(0).getSheetName());
            assertEquals("Chi tiết giao dịch", wb.getSheetAt(1).getSheetName());

            // Check header row in Sheet 2
            var sheet2 = wb.getSheetAt(1);
            assertNotNull(sheet2.getRow(2));
            assertEquals("STT", sheet2.getRow(2).getCell(0).getStringCellValue());
            assertEquals("Số tiền", sheet2.getRow(2).getCell(6).getStringCellValue());
        }
    }

    @Test
    @DisplayName("Excel Export should handle empty transactions list gracefully")
    void testExportToExcel_EmptyTransactions() throws Exception {
        byte[] excelBytes = exportService.exportToExcel(
                testUser, testSpace, List.of(),
                LocalDate.now().minusMonths(1), LocalDate.now()
        );

        assertNotNull(excelBytes);
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            assertEquals(2, wb.getNumberOfSheets());
        }
    }
}
