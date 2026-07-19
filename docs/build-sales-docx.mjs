import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "IMS_Product_Sales_Overview.docx");

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, ...opts })],
  });
}

function boldBody(text) {
  return body(text, { bold: true });
}

function bullet(text, boldPrefix) {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix, bold: true }));
    children.push(new TextRun({ text: text.slice(boldPrefix.length) }));
  } else {
    children.push(new TextRun({ text }));
  }
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children,
  });
}

function quote(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    indent: { left: 720, right: 720 },
    children: [new TextRun({ text, bold: true, italics: true, size: 28 })],
  });
}

function italicCenter(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text, italics: true, size: 22 })],
  });
}

function tableFromRows(rows, header = true) {
  const tableRows = rows.map((cells, rowIndex) => {
    const isHeader = header && rowIndex === 0;
    return new TableRow({
      children: cells.map(
        (cell) =>
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            shading: isHeader
              ? { fill: "2E5090", type: ShadingType.CLEAR }
              : undefined,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cell,
                    bold: isHeader,
                    color: isHeader ? "FFFFFF" : undefined,
                    size: 20,
                  }),
                ],
              }),
            ],
          })
      ),
    });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

const integrationRows = [
  ["Integration area", "Third-party / standard", "Business benefit"],
  [
    "Database",
    "MongoDB (Community Server, Docker, or MongoDB Atlas cloud)",
    "Enterprise-grade storage, backup, replication, and optional cloud hosting",
  ],
  [
    "Data access",
    "REST API (Node.js, JSON)",
    "Connect mobile apps, e-commerce, BI tools, custom reports, or partner systems without modifying the desktop app",
  ],
  [
    "Database tools",
    "MongoDB Compass and compatible viewers",
    "IT teams can inspect, audit, and export data using familiar tooling",
  ],
  [
    "Printing",
    "Windows print system (any installed printer, PDF printers)",
    "Tax invoices and documents on A3/A4/A5 or custom receipt sizes",
  ],
  [
    "Deployment",
    "Docker Compose (optional API stack)",
    "Faster rollout in offices and data centers",
  ],
  [
    "Desktop platform",
    "Microsoft Windows (.NET 8, WPF)",
    "Native performance on the PCs your staff already use",
  ],
  [
    "Future extensions",
    "Open API for accounting, CRM, e-commerce, barcode hardware, SMS/WhatsApp",
    "Your integrator—or our team—can wire IMS into your existing toolchain",
  ],
];

const deploymentRows = [
  ["Model", "Description"],
  [
    "Single-store",
    "Windows desktop + local MongoDB + API on same machine",
  ],
  [
    "LAN",
    "API + database on office server; multiple desktops point to one API URL",
  ],
  [
    "Cloud DB",
    "Desktop in branches + MongoDB Atlas + API on VPS or cloud VM",
  ],
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
      },
    },
  },
  sections: [
    {
      properties: {},
      children: [
        heading("IMS — Inventory Management System"),
        heading("Product Overview & Customer Proposal", HeadingLevel.HEADING_2),
        heading("Your dedicated line", HeadingLevel.HEADING_3),
        quote(
          "Run your entire business—from stock to sales to accounts—on one fast desktop system that connects openly to the databases and services you already trust."
        ),
        italicCenter(
          "Use this line on brochures, proposals, email headers, and demo opening slides."
        ),
        heading("Executive summary", HeadingLevel.HEADING_2),
        body(
          "IMS (Inventory Management System) is a modern, desktop-first business application built for trading, distribution, and light manufacturing operations. It unifies inventory, sales, purchase, production, and finance in a single, easy-to-learn workspace—backed by a secure REST API and MongoDB database so your data stays structured, searchable, and ready for growth."
        ),
        body(
          "Unlike closed, monolithic packages, IMS is designed for real-world deployment: on-premise or cloud database, configurable document numbering, professional tax-invoice printing, and third-party integration as a first-class capability—not an afterthought."
        ),
        heading("Third-party integration (explicitly included)", HeadingLevel.HEADING_2),
        body(
          "IMS is delivered as a connected product, not an isolated island. We provide and support integration with established third-party platforms and standards:"
        ),
        tableFromRows(integrationRows),
        new Paragraph({ spacing: { after: 120 } }),
        boldBody("Important for buyers:"),
        body(
          " Third-party components (MongoDB, Node.js runtime, Windows, printers) are industry-standard; licensing and hosting for those services remain with the vendor you choose (e.g. MongoDB Atlas subscription), while IMS provides the application layer, API, and integration documentation."
        ),
        body(
          "We also offer integration services (scope-based) for custom connectors, data migration from spreadsheets or legacy ERP, and branded invoice layouts."
        ),
        heading("Why customers choose IMS", HeadingLevel.HEADING_2),
        bullet("One screen, full flow — Counter sales, purchase, stock transfer, and vouchers without switching between unrelated tools."),
        bullet("Speed at the counter — Barcode-friendly line entry, keyboard shortcuts (Save, Save & Next, Print), multi-tab sales orders."),
        bullet("Numbers you can trust — Document numbers, SO prefixes, and live dashboard counts come from the database—not demo placeholders."),
        bullet("Print-ready compliance — Company registration, GST-style tax invoice layout, paper size and margin control from Settings."),
        bullet("Room to grow — Start on a single PC + local MongoDB; scale to LAN API server and cloud database when you expand."),
        heading("Key features that impress", HeadingLevel.HEADING_2),
        heading("1. Real-time operations dashboard", HeadingLevel.HEADING_3),
        body(
          "Live KPIs for sales orders (open, to ship, shipped, cancelled), products, and finance—so managers see the business now, not last month's spreadsheet."
        ),
        heading("2. Sales order workspace (POS-style)", HeadingLevel.HEADING_3),
        bullet("Fast product lookup by barcode or name"),
        bullet("Customer validation from master data"),
        bullet("Configurable SO prefix (e.g. SO, INV, EXP) with per-prefix numbering stored in MongoDB"),
        bullet("Save, Save & Next, Save, Print & Next with professional tax invoice print"),
        bullet("Multi-tab billing for busy counters"),
        heading("3. Complete purchase cycle", HeadingLevel.HEADING_3),
        body(
          "Purchase orders → GRN → purchase invoice → purchase return, aligned with how distributors actually buy and receive stock."
        ),
        heading("4. Inventory control", HeadingLevel.HEADING_3),
        body(
          "Stock transfer between locations, movement history, warehouse/godown support—stock always traceable."
        ),
        heading("5. Finance & accounting documents", HeadingLevel.HEADING_3),
        body(
          "Payment vouchers, receipt vouchers, credit/debit notes, bank entries, and petty cash—linked to the same product and account masters."
        ),
        heading("6. Rich product & account administration", HeadingLevel.HEADING_3),
        body(
          "Product master with types, main/sub groups, assembly types, sale UOM; account ledger for customers and suppliers; customer types and user management."
        ),
        heading("7. Company registration & branded printing", HeadingLevel.HEADING_3),
        body(
          "Store legal name, GSTIN, address, bank details, and terms once—every tax invoice reflects your brand."
        ),
        heading("8. Settings that stick", HeadingLevel.HEADING_3),
        body(
          "Theme, A4/A5/A3/custom print formats, margins, and API URL—saved per workstation in local settings, applied instantly to print and preview."
        ),
        heading("9. Modern desktop experience", HeadingLevel.HEADING_3),
        body(
          "Clean, sectioned navigation; paginated lists; full-page forms (no cramped popups); responsive layout for day-long use."
        ),
        heading("10. API-first architecture for integrators", HeadingLevel.HEADING_3),
        body(
          "Every major entity (products, accounts, sales orders, vouchers, dashboard) is available over documented REST endpoints—ideal for:"
        ),
        bullet("Head office reporting in Power BI / Excel"),
        bullet("Web store order import"),
        bullet("Partner logistics or accounting packages"),
        bullet("Custom mobile apps for warehouse staff"),
        heading("Typical customer profile", HeadingLevel.HEADING_2),
        body("IMS is ideal for:"),
        bullet("Retail & wholesale (fashion, electronics, FMCG, industrial supply)"),
        bullet("Multi-location distributors needing transfers and challans"),
        bullet("Growing SMEs outgrowing Excel but not ready for a heavy international ERP"),
        bullet("IT partners reselling a solution they can host, integrate, and support"),
        heading("Deployment options (summary)", HeadingLevel.HEADING_2),
        tableFromRows(deploymentRows),
        new Paragraph({ spacing: { after: 120 } }),
        heading("What we deliver", HeadingLevel.HEADING_2),
        bullet("IMS desktop application (Windows)"),
        bullet("IMS API source/runtime package with seed data option"),
        bullet("Installation & quick-start guide"),
        bullet("API endpoint overview for technical teams"),
        bullet("Optional: training, customization, third-party integration project, annual support"),
        heading("Closing value statement", HeadingLevel.HEADING_2),
        body(
          "IMS turns daily operations—selling, buying, moving stock, and recording money—into one coherent system, while staying open to MongoDB, cloud hosting, printers, and custom integrations your business already relies on."
        ),
        body(
          "For demos, licensing, integration scope, or deployment assistance, contact your IMS sales representative."
        ),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Document version: 1.0 — IMS Product Sales Overview",
              italics: true,
              size: 20,
              color: "666666",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Prepared for customer proposals and partner resale.",
              italics: true,
              size: 20,
              color: "666666",
            }),
          ],
        }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log("Created:", outPath);
