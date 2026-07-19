# Sales documentation

| File | Purpose |
|------|---------|
| `IMS_Sales_Team_Document` (.md / .docx / .pptx) | Full client-ready sales guide (non-technical) |
| `IMS_Executive_Summary_One_Pager` (.md / .docx / .pptx) | One-page executive summary for proposals & email |
| `IMS_Sales_Presentation_10_Slides` (.md / .docx / .pptx) | **Best for client demos** — 10-slide deck with speaker notes |
| `README` (.md / .docx / .pptx) | Export tips and file index |

## Before client meetings

1. Open `IMS_Sales_Team_Document.md` in VS Code, Word (via import), or Pandoc.
2. Replace all `[Insert screenshot: …]` placeholders with branded images.
3. Fill **Pricing**, **Contact**, and **Support/Training** bracketed fields.
4. Add your company logo on the cover when exporting.

## Export options

**Microsoft Word**  
- Open the `.md` file in Word (File → Open), or use [Pandoc](https://pandoc.org):  
  `pandoc IMS_Sales_Team_Document.md -o IMS_Sales_Team_Document.docx`

**PDF**  
- From Word: Save As → PDF  
- Or Pandoc:  
  `pandoc IMS_Sales_Team_Document.md -o IMS_Sales_Team_Document.pdf`

**PowerPoint**  
- Use the generated `.pptx` files in this folder (from Pandoc).  
- **Recommended:** `IMS_Sales_Presentation_10_Slides.pptx` — polish layout, add screenshots, apply your theme.  
- `IMS_Sales_Team_Document.pptx` is a long deck (one slide per heading); trim or use as backup.  
- Re-export: `pandoc IMS_Sales_Presentation_10_Slides.md -o IMS_Sales_Presentation_10_Slides.pptx`
