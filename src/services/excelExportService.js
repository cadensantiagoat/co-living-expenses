
import { supabase } from "../lib/supabase";
import { MONTHS } from "../data/expenseConfig";

// Download every page of records, not just the first 1000.
async function fetchAll(table, userId) {
  const result = [];
  const pageSize = 500;

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("id")
      .range(start, start + pageSize - 1);

    if (error) throw error;

    result.push(...data);

    if (data.length < pageSize) break;
  }

  return result;
}

function safeSheetName(name, used) {
  const cleaned = name
    .replace(/[\[\]:*?/\\]/g, "")
    .replace(/^'+|'+$/g, "")
    .trim() || "Property";

  let candidate = cleaned.slice(0, 31);
  let number = 2;

  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${number++})`;
    candidate = cleaned.slice(0, 31 - suffix.length) + suffix;
  }

  used.add(candidate.toLowerCase());
  return candidate;
}

export async function exportExpenseWorkbook() {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;
  if (!authData.user) throw new Error("Please sign in first.");

  const userId = authData.user.id;

  const [properties, categories, expenses] = await Promise.all([
    fetchAll("properties", userId),
    fetchAll("expense_categories", userId),
    fetchAll("expenses", userId),
  ]);

  // Load the library only when someone downloads a workbook.
  const ExcelJS = (
    await import("exceljs/dist/exceljs.min.js")
  ).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Property Expense Tracker";
  workbook.created = new Date();

  const currencyFormat = '"$"#,##0.00;[Red]("$"#,##0.00)';
  const usedNames = new Set(["portfolio summary"]);

  // Portfolio summary worksheet.
  const summary = workbook.addWorksheet("Portfolio Summary");

  summary.addRow([
    "Property",
    "Status",
    "Year",
    "Annual Expenses",
  ]);

  summary.columns = [
    { width: 35 },
    { width: 16 },
    { width: 14 },
    { width: 22 },
  ];

  summary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summary.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF172B4D" },
  };

  const yearsByProperty = new Map();

  for (const expense of expenses) {
    if (!yearsByProperty.has(expense.property_id)) {
      yearsByProperty.set(expense.property_id, new Set());
    }
    yearsByProperty.get(expense.property_id).add(expense.year);
  }

  const expenseLookup = new Map();

  for (const expense of expenses) {
    const key = [
      expense.property_id,
      expense.category_id,
      expense.year,
      expense.month,
    ].join("|");

    expenseLookup.set(key, Number(expense.amount));
  }

  let summaryRow = 2;

  for (const property of properties) {
    const propertyYears = [
      ...(yearsByProperty.get(property.id) || []),
    ].sort((a, b) => a - b);

    // Include the current year even for a new property
    // that has no expense records yet.
    if (propertyYears.length === 0) {
      propertyYears.push(new Date().getFullYear());
    }

    for (const year of propertyYears) {
      const sheetName = safeSheetName(
        `${property.name} - ${year}`,
        usedNames
      );

      const sheet = workbook.addWorksheet(sheetName);

      sheet.mergeCells("A1:N1");
      sheet.getCell("A1").value = property.name;
      sheet.getCell("A1").font = {
        size: 16,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      sheet.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF172B4D" },
      };

      sheet.mergeCells("A2:N2");
      sheet.getCell("A2").value =
        `${property.address || "No address"} | ${year} | ` +
        (property.archived_at ? "Archived" : "Active");

      const headers = [
        "Expense Category",
        ...MONTHS,
        "Year Total",
      ];

      const headerRow = sheet.getRow(4);
      headerRow.values = headers;
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDCEAFE" },
      };

      sheet.getColumn(1).width = 28;

      for (let col = 2; col <= 14; col++) {
        sheet.getColumn(col).width = 16;
      }

      // Categories are linked by ID, so renamed
      // categories retain their historical values.
      for (const category of categories) {
        const amounts = MONTHS.map((_, index) => {
          const key = [
            property.id,
            category.id,
            year,
            index + 1,
          ].join("|");

          return expenseLookup.get(key) ?? 0;
        });

        const rowNumber = sheet.rowCount + 1;

        const row = sheet.addRow([
          category.name,
          ...amounts,
          {
            formula: `SUM(B${rowNumber}:M${rowNumber})`,
            result: amounts.reduce((sum, value) => sum + value, 0),
          },
        ]);

        for (let col = 2; col <= 14; col++) {
          row.getCell(col).numFmt = currencyFormat;
        }
      }

      const firstDataRow = 5;
      const lastDataRow = sheet.rowCount;
      const monthlyTotals = MONTHS.map((_, index) =>
        categories.reduce((sum, category) => {
          const key = [
            property.id,
            category.id,
            year,
            index + 1,
          ].join("|");

          return sum + (expenseLookup.get(key) || 0);
        }, 0)
      );

      const yearlyTotal = monthlyTotals.reduce(
        (sum, value) => sum + value,
        0
      );

      const totalRow = sheet.addRow([
        "Monthly Total",
        ...monthlyTotals.map((value, index) => ({
          formula:
            `SUM(${sheet.getColumn(index + 2).letter}` +
            `${firstDataRow}:` +
            `${sheet.getColumn(index + 2).letter}` +
            `${lastDataRow})`,
          result: value,
        })),
        {
          formula: `SUM(N${firstDataRow}:N${lastDataRow})`,
          result: yearlyTotal,
        },
      ]);

      totalRow.font = { bold: true };
      totalRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDCEAFE" },
      };

      for (let col = 2; col <= 14; col++) {
        totalRow.getCell(col).numFmt = currencyFormat;
      }

      sheet.views = [
        { state: "frozen", xSplit: 1, ySplit: 4 },
      ];

      const resultRow = summary.addRow([
        property.name,
        property.archived_at ? "Archived" : "Active",
        year,
        {
          formula: `SUM('${sheetName.replace(/'/g, "''")}'!N${totalRow.number})`,
          result: yearlyTotal,
        },
      ]);

      resultRow.getCell(4).numFmt = currencyFormat;
      summaryRow++;
    }
  }

  const totalResult = summary.addRow([
    "Portfolio Total",
    "",
    "",
    {
      formula:
        summaryRow > 2
          ? `SUM(D2:D${summaryRow - 1})`
          : "0",
      result: expenses.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      ),
    },
  ]);

  totalResult.font = { bold: true };
  totalResult.getCell(4).numFmt = currencyFormat;

  summary.views = [{ state: "frozen", ySplit: 1 }];

  // Build the Excel file in memory.
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type:
      "application/vnd.openxmlformats-officedocument." +
      "spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    `Property_Expenses_${new Date().toISOString().slice(0, 10)}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoke after giving the browser time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
