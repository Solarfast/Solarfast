---
name: PDF report rendering
description: Validation and defensive-rendering rules for the VOLTRAX React-PDF reports.
---

When changing PDF report rows, guard string operations on labels and subtitles because row content can be optional or generated from selected products. A frontend build or static results-page preview does not exercise the React-PDF rendering path.

**Why:** PDF generation is a separate runtime path; report failures can occur only when the document is laid out even though the application builds and the results page loads.

**How to apply:** After changing `PDFReport`, render representative report data through React-PDF and verify that the output is fully produced. Include dynamic-contract values and both supported languages when the changed copy is bilingual.

In a vertically stacked summary column, do not let every card inherit `flex: 1`. React-PDF can divide the column's available height between the cards even when one card's wrapped content needs more room, causing its text to overlap later rows.

**Why:** Stress-rendering a report with a long product name exposed visual overlap that page-bound checks alone did not catch.

**How to apply:** Let stacked cards size to their content (`flexBasis: 'auto'`, no forced growth), keep flexible sizing on the parent columns, and inspect a rendered PDF with long names and values.