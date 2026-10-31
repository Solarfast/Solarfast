from pathlib import Path
import sys

import fitz


source_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/voltrax-pdf-layout-smoke")
output_dir = Path(".agents/outputs/pdf-layout-smoke")
output_dir.mkdir(parents=True, exist_ok=True)

pdf_paths = sorted(source_dir.glob("*.pdf"))
if not pdf_paths:
    raise SystemExit(f"No PDFs found in {source_dir}")

for pdf_path in pdf_paths:
    document = fitz.open(pdf_path)
    print(f"\n{pdf_path.name}: {document.page_count} pages")
    for page_number, page in enumerate(document, start=1):
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.45, 1.45), alpha=False)
        image_path = output_dir / f"{pdf_path.stem}-page-{page_number:02d}.png"
        pixmap.save(image_path)

        text = page.get_text("text")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        blocks = page.get_text("dict")["blocks"]
        out_of_page = []
        for block in blocks:
            if block.get("type") != 0:
                continue
            x0, y0, x1, y1 = block["bbox"]
            if x0 < -0.5 or y0 < -0.5 or x1 > page.rect.width + 0.5 or y1 > page.rect.height + 0.5:
                out_of_page.append((tuple(round(v, 1) for v in block["bbox"]), block.get("lines", [{}])[0].get("spans", [{}])[0].get("text", "")[:60]))

        print(
            f"  page {page_number}: {page.rect.width:.1f}×{page.rect.height:.1f} pt, "
            f"{len(lines)} text lines, image={image_path}"
        )
        print(f"    first: {' | '.join(lines[:3])}")
        print(f"    last:  {' | '.join(lines[-3:])}")
        if out_of_page:
            print(f"    WARNING: text blocks outside page: {out_of_page}")

    document.close()