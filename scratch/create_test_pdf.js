import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createTestPdf() {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText('Test PDF File for PDFAid', {
        x: 50,
        y: height - 100,
        size: 30,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText('This is a test page for verifying PDF operations.', {
        x: 50,
        y: height - 150,
        size: 15,
        font,
        color: rgb(0.3, 0.3, 0.3),
    });

    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(process.cwd(), 'test_sample.pdf');
    fs.writeFileSync(filePath, pdfBytes);
    console.log(`PDF created at: ${filePath}`);
}

createTestPdf().catch(console.error);
