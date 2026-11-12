// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.Transaction;
import com.example.bton.entity.User;
import com.example.bton.enums.TransactionType;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.extern.slf4j.Slf4j;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.data.category.DefaultCategoryDataset;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
public class PdfReportGenerator {

    private static final String LABEL_EXPENSE = "Chi tiêu";
    private static final String LABEL_INCOME = "Thu nhập";
    private static final String LABEL_CASH_FLOW = "Dòng tiền";

    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,##0 ₫");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    static {
        System.setProperty("java.awt.headless", "true");
    }

    public byte[] generatePdf(User user, FinancialSpace space, List<Transaction> transactions, LocalDate from, LocalDate to) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc, PageSize.A4);
            document.setMargins(25, 25, 25, 25);

            FontHolder fontHolder = resolvePdfFonts();
            PdfFont fontRegular = fontHolder.regular;
            PdfFont fontBold = fontHolder.bold;
            boolean isUnicode = fontHolder.isUnicode;

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

            // 1. Header Banner
            Paragraph brandPara = new Paragraph(txt("BUDGIVEE  •  HỆ THỐNG QUẢN LÝ TÀI CHÍNH CÁ NHÂN", isUnicode))
                    .setFont(fontBold)
                    .setFontSize(10)
                    .setFontColor(new DeviceRgb(37, 99, 235))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(2);
            document.add(brandPara);

            Paragraph titlePara = new Paragraph(txt("BÁO CÁO THU CHI TÀI CHÍNH", isUnicode))
                    .setFont(fontBold)
                    .setFontSize(18)
                    .setFontColor(new DeviceRgb(30, 41, 59))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(4);
            document.add(titlePara);

            String timeRangeStr = "Từ ngày: " + (from != null ? from.format(DATE_FORMATTER) : "Khởi tạo")
                    + "  —  Đến ngày: " + (to != null ? to.format(DATE_FORMATTER) : "Hiện tại");
            Paragraph timePara = new Paragraph(txt(timeRangeStr + "   |   Xuất lúc: " + LocalDateTime.now().format(DATETIME_FORMATTER), isUnicode))
                    .setFont(fontRegular)
                    .setFontSize(9)
                    .setFontColor(new DeviceRgb(100, 116, 139))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(12);
            document.add(timePara);

            // 2. User & Space Metadata Box
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{50f, 50f}));
            infoTable.setWidth(UnitValue.createPercentValue(100));
            infoTable.setBackgroundColor(new DeviceRgb(248, 250, 252));
            infoTable.setBorder(new SolidBorder(new DeviceRgb(226, 232, 240), 1));
            infoTable.setMarginBottom(12);

            String userName;
            if (user != null && user.getFullName() != null && !user.getFullName().isBlank()) {
                userName = user.getFullName();
            } else if (user != null) {
                userName = user.getUsername();
            } else {
                userName = "N/A";
            }
            String userEmail = user != null ? user.getEmail() : "";
            String spaceName = space != null ? space.getName() : "Không gian cá nhân";

            Cell cUser = new Cell().setBorder(Border.NO_BORDER).setPadding(8);
            cUser.add(new Paragraph(txt("Người xuất báo cáo: " + userName, isUnicode)).setFont(fontBold).setFontSize(10).setFontColor(new DeviceRgb(51, 65, 85)));
            if (!userEmail.isBlank()) {
                cUser.add(new Paragraph(txt("Email: " + userEmail, isUnicode)).setFont(fontRegular).setFontSize(9).setFontColor(new DeviceRgb(100, 116, 139)));
            }
            infoTable.addCell(cUser);

            Cell cSpace = new Cell().setBorder(Border.NO_BORDER).setPadding(8);
            cSpace.add(new Paragraph(txt("Không gian tài chính: " + spaceName, isUnicode)).setFont(fontBold).setFontSize(10).setFontColor(new DeviceRgb(51, 65, 85)));
            cSpace.add(new Paragraph(txt("Tổng số giao dịch: " + transactions.size(), isUnicode)).setFont(fontRegular).setFontSize(9).setFontColor(new DeviceRgb(100, 116, 139)));
            infoTable.addCell(cSpace);

            document.add(infoTable);

            // 3. KPI Summary Cards (Balance cuối kỳ)
            Table kpiTable = new Table(UnitValue.createPercentArray(new float[]{33.33f, 33.33f, 33.34f}));
            kpiTable.setWidth(UnitValue.createPercentValue(100));
            kpiTable.setMarginBottom(14);

            kpiTable.addCell(createKpiCell(txt("TỔNG THU NHẬP", isUnicode), CURRENCY_FORMAT.format(totalIncome),
                    new DeviceRgb(236, 253, 245), new DeviceRgb(16, 185, 129), fontBold, isUnicode));
            kpiTable.addCell(createKpiCell(txt("TỔNG CHI TIÊU", isUnicode), CURRENCY_FORMAT.format(totalExpense),
                    new DeviceRgb(254, 242, 242), new DeviceRgb(239, 68, 68), fontBold, isUnicode));
            kpiTable.addCell(createKpiCell(txt("SỐ DƯ CUỐI KỲ", isUnicode), CURRENCY_FORMAT.format(netBalance),
                    new DeviceRgb(239, 246, 255), netBalance.compareTo(BigDecimal.ZERO) >= 0 ? new DeviceRgb(37, 99, 235) : new DeviceRgb(239, 68, 68), fontBold, isUnicode));

            document.add(kpiTable);

            // 4. Biểu đồ nhúng trong PDF (Bar Chart Thu/Chi)
            byte[] chartPng = generateCashFlowBarChart(totalIncome, totalExpense, netBalance);
            if (chartPng != null && chartPng.length > 0) {
                Paragraph chartTitle = new Paragraph(txt("1. BIỂU ĐỒ SO SÁNH DÒNG TIỀN (THU - CHI - SỐ DƯ)", isUnicode))
                        .setFont(fontBold)
                        .setFontSize(11)
                        .setFontColor(new DeviceRgb(30, 41, 59))
                        .setMarginBottom(4);
                document.add(chartTitle);

                Image chartImg = new Image(ImageDataFactory.create(chartPng));
                chartImg.setWidth(UnitValue.createPercentValue(100));
                chartImg.setMaxHeight(180);
                chartImg.setMarginBottom(14);
                document.add(chartImg);
            }

            // 5. Bảng tổng hợp theo Category
            Paragraph catTitle = new Paragraph(txt("2. TỔNG HỢP THEO DANH MỤC", isUnicode))
                    .setFont(fontBold)
                    .setFontSize(11)
                    .setFontColor(new DeviceRgb(30, 41, 59))
                    .setMarginBottom(6);
            document.add(catTitle);

            Map<String, CategoryAggregation> catMap = aggregateCategories(transactions, totalIncome, totalExpense);
            Table catTable = new Table(UnitValue.createPercentArray(new float[]{8f, 37f, 15f, 25f, 15f}));
            catTable.setWidth(UnitValue.createPercentValue(100));
            catTable.setMarginBottom(14);

            addTableHeader(catTable, new String[]{"STT", "Danh mục", "Loại", "Tổng tiền", "Tỷ lệ"}, fontBold, isUnicode);

            int catStt = 1;
            for (CategoryAggregation ca : catMap.values()) {
                DeviceRgb bg = (catStt % 2 == 0) ? new DeviceRgb(248, 250, 252) : new DeviceRgb(255, 255, 255);
                catTable.addCell(createDataCell(String.valueOf(catStt++), TextAlignment.CENTER, fontRegular, bg, isUnicode));
                catTable.addCell(createDataCell(ca.name, TextAlignment.LEFT, fontRegular, bg, isUnicode));
                catTable.addCell(createDataCell(ca.typeLabel, TextAlignment.CENTER, fontRegular, bg, isUnicode));
                catTable.addCell(createDataCell(CURRENCY_FORMAT.format(ca.totalAmount), TextAlignment.RIGHT, fontBold, bg, isUnicode));
                catTable.addCell(createDataCell(String.format("%.1f%%", ca.percentage), TextAlignment.RIGHT, fontRegular, bg, isUnicode));
            }
            if (catMap.isEmpty()) {
                Cell emptyCell = new Cell(1, 5)
                        .add(new Paragraph(txt("Không có dữ liệu danh mục trong khoảng thời gian này.", isUnicode)).setTextAlignment(TextAlignment.CENTER))
                        .setFont(fontRegular).setFontSize(9).setPadding(8);
                catTable.addCell(emptyCell);
            }
            document.add(catTable);

            // 6. Bảng giao dịch chi tiết
            Paragraph txTitle = new Paragraph(txt("3. DANH SÁCH GIAO DỊCH CHI TIẾT", isUnicode))
                    .setFont(fontBold)
                    .setFontSize(11)
                    .setFontColor(new DeviceRgb(30, 41, 59))
                    .setMarginBottom(6);
            document.add(txTitle);

            Table txTable = new Table(UnitValue.createPercentArray(new float[]{6f, 14f, 12f, 18f, 16f, 18f, 16f}));
            txTable.setWidth(UnitValue.createPercentValue(100));
            txTable.setMarginBottom(10);

            addTableHeader(txTable, new String[]{"STT", "Ngày", "Loại", "Danh mục", "Ví", "Số tiền", "Ghi chú"}, fontBold, isUnicode);

            int txStt = 1;
            for (Transaction t : transactions) {
                DeviceRgb bg = (txStt % 2 == 0) ? new DeviceRgb(248, 250, 252) : new DeviceRgb(255, 255, 255);
                String dateStr = t.getTransactionDate() != null ? t.getTransactionDate().format(DATE_FORMATTER) : "-";
                String typeStr = resolveTransactionTypeLabel(t.getType());
                String catName = resolveCategoryName(t);
                String walletName = t.getWallet() != null ? t.getWallet().getName() : "-";
                String note = resolveTransactionNote(t);

                txTable.addCell(createDataCell(String.valueOf(txStt++), TextAlignment.CENTER, fontRegular, bg, isUnicode));
                txTable.addCell(createDataCell(dateStr, TextAlignment.CENTER, fontRegular, bg, isUnicode));
                txTable.addCell(createDataCell(typeStr, TextAlignment.CENTER, fontRegular, bg, isUnicode));
                txTable.addCell(createDataCell(catName, TextAlignment.LEFT, fontRegular, bg, isUnicode));
                txTable.addCell(createDataCell(walletName, TextAlignment.LEFT, fontRegular, bg, isUnicode));

                Cell cAmount = createDataCell(CURRENCY_FORMAT.format(t.getAmount()), TextAlignment.RIGHT, fontBold, bg, isUnicode);
                if (t.getType() == TransactionType.INCOME) {
                    cAmount.setFontColor(new DeviceRgb(16, 185, 129));
                } else if (t.getType() == TransactionType.EXPENSE) {
                    cAmount.setFontColor(new DeviceRgb(239, 68, 68));
                }
                txTable.addCell(cAmount);
                txTable.addCell(createDataCell(note, TextAlignment.LEFT, fontRegular, bg, isUnicode));
            }
            if (transactions.isEmpty()) {
                Cell emptyCell = new Cell(1, 7)
                        .add(new Paragraph(txt("Không có giao dịch nào trong khoảng thời gian đã chọn.", isUnicode)).setTextAlignment(TextAlignment.CENTER))
                        .setFont(fontRegular).setFontSize(9).setPadding(8);
                txTable.addCell(emptyCell);
            }
            document.add(txTable);

            // Footer note
            Paragraph footer = new Paragraph(txt("Báo cáo được xuất tự động từ hệ thống Budgivee / BTON Finance. Tất cả quyền được bảo lưu.", isUnicode))
                    .setFont(fontRegular)
                    .setFontSize(8)
                    .setFontColor(new DeviceRgb(148, 163, 184))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(10);
            document.add(footer);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Lỗi khi xuất báo cáo PDF: {}", e.getMessage(), e);
            throw new IllegalStateException("Lỗi khi tạo tệp PDF báo cáo: " + e.getMessage(), e);
        }
    }

    private byte[] generateCashFlowBarChart(BigDecimal totalIncome, BigDecimal totalExpense, BigDecimal netBalance) {
        try {
            DefaultCategoryDataset dataset = new DefaultCategoryDataset();
            dataset.addValue(totalIncome.doubleValue(), LABEL_CASH_FLOW, LABEL_INCOME);
            dataset.addValue(totalExpense.doubleValue(), LABEL_CASH_FLOW, LABEL_EXPENSE);
            dataset.addValue(netBalance.doubleValue(), LABEL_CASH_FLOW, "Số dư cuối kỳ");

            JFreeChart chart = ChartFactory.createBarChart(
                    "So sánh Dòng tiền Thu - Chi - Số dư (VNĐ)",
                    null,
                    "Số tiền (VNĐ)",
                    dataset,
                    PlotOrientation.VERTICAL,
                    false,
                    true,
                    false
            );

            chart.setBackgroundPaint(Color.WHITE);
            CategoryPlot plot = chart.getCategoryPlot();
            plot.setBackgroundPaint(new Color(248, 250, 252));
            plot.setRangeGridlinePaint(new Color(226, 232, 240));

            BarRenderer renderer = new BarRenderer() {
                @Override
                public java.awt.Paint getItemPaint(int row, int column) {
                    if (column == 0) return new Color(16, 185, 129); // Thu nhập: xanh lá
                    if (column == 1) return new Color(239, 68, 68);  // Chi tiêu: đỏ
                    return new Color(37, 99, 235);                    // Số dư: xanh dương
                }
            };
            renderer.setDrawBarOutline(false);
            renderer.setMaximumBarWidth(0.25);
            plot.setRenderer(renderer);

            BufferedImage bufferedImage = chart.createBufferedImage(540, 220);
            ByteArrayOutputStream chartOut = new ByteArrayOutputStream();
            ImageIO.write(bufferedImage, "png", chartOut);
            return chartOut.toByteArray();
        } catch (Exception e) {
            log.warn("Không thể tạo biểu đồ JFreeChart cho báo cáo PDF: {}", e.getMessage());
            return new byte[0];
        }
    }

    private String resolveTransactionTypeLabel(TransactionType type) {
        if (type == TransactionType.INCOME) return LABEL_INCOME;
        if (type == TransactionType.EXPENSE) return LABEL_EXPENSE;
        return "Chuyển tiền";
    }

    private String resolveCategoryName(Transaction t) {
        if (t.getCategory() == null) return "Khác";
        if (t.getCategory().getNameVi() != null && !t.getCategory().getNameVi().isBlank()) {
            return t.getCategory().getNameVi();
        }
        return t.getCategory().getName() != null ? t.getCategory().getName() : "Khác";
    }

    private String resolveTransactionNote(Transaction t) {
        if (t.getDescription() != null && !t.getDescription().isBlank()) {
            return t.getDescription();
        }
        return t.getNote() != null ? t.getNote() : "";
    }

    private Cell createKpiCell(String label, String value, DeviceRgb bg, DeviceRgb textColor,
                               PdfFont fontBold, boolean isUnicode) {
        Cell cell = new Cell().setBackgroundColor(bg).setBorder(new SolidBorder(new DeviceRgb(226, 232, 240), 1)).setPadding(10);
        cell.add(new Paragraph(txt(label, isUnicode)).setFont(fontBold).setFontSize(9).setFontColor(new DeviceRgb(100, 116, 139)));
        cell.add(new Paragraph(txt(value, isUnicode)).setFont(fontBold).setFontSize(13).setFontColor(textColor).setMarginTop(4));
        return cell;
    }

    private void addTableHeader(Table table, String[] headers, PdfFont fontBold, boolean isUnicode) {
        for (String h : headers) {
            Cell cell = new Cell()
                    .setBackgroundColor(new DeviceRgb(37, 99, 235))
                    .setBorder(new SolidBorder(new DeviceRgb(29, 78, 216), 1))
                    .setPadding(6)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE)
                    .add(new Paragraph(txt(h, isUnicode)).setFont(fontBold).setFontSize(9).setFontColor(ColorConstants.WHITE));
            table.addHeaderCell(cell);
        }
    }

    private Cell createDataCell(String text, TextAlignment align, PdfFont font, DeviceRgb bg, boolean isUnicode) {
        return new Cell()
                .setBackgroundColor(bg)
                .setBorder(new SolidBorder(new DeviceRgb(241, 245, 249), 1))
                .setPadding(5)
                .setTextAlignment(align)
                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                .add(new Paragraph(txt(text, isUnicode)).setFont(font).setFontSize(8).setFontColor(new DeviceRgb(51, 65, 85)));
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

    private static String txt(String input, boolean isUnicode) {
        if (input == null) return "";
        if (isUnicode) return input;
        String nfd = Normalizer.normalize(input, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{M}", "").replace("đ", "d").replace("Đ", "D");
    }

    private FontHolder resolvePdfFonts() {
        String[] fontPaths = {
                "/usr/share/fonts/dejavu/DejaVuSans.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/usr/share/fonts/TTF/DejaVuSans.ttf",
                "C:\\Windows\\Fonts\\arial.ttf",
                "C:\\Windows\\Fonts\\segoeui.ttf",
                "C:\\Windows\\Fonts\\tahoma.ttf"
        };
        for (String path : fontPaths) {
            File f = new File(path);
            if (f.exists() && f.canRead()) {
                try {
                    PdfFont reg = PdfFontFactory.createFont(path, PdfEncodings.IDENTITY_H, PdfFontFactory.EmbeddingStrategy.FORCE_EMBEDDED);
                    PdfFont bold = reg;
                    String boldPath = path.replace(".ttf", "bd.ttf").replace(".TTF", "BD.TTF");
                    if (new File(boldPath).exists()) {
                        bold = PdfFontFactory.createFont(boldPath, PdfEncodings.IDENTITY_H, PdfFontFactory.EmbeddingStrategy.FORCE_EMBEDDED);
                    }
                    return new FontHolder(reg, bold, true);
                } catch (Exception ignored) {
                }
            }
        }
        try {
            PdfFont reg = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            return new FontHolder(reg, bold, false);
        } catch (Exception e) {
            throw new RuntimeException("Cannot initialize default PDF fonts", e);
        }
    }

    private record FontHolder(PdfFont regular, PdfFont bold, boolean isUnicode) {}

    private static class CategoryAggregation {
        String name;
        TransactionType type;
        boolean isIncome;
        String typeLabel;
        BigDecimal totalAmount;
        double percentage;
    }
}

