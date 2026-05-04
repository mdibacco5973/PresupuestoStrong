import fs from 'fs/promises'
import path from 'path'
import { PDFDocument, PDFName, PDFContentStream, PDFRawStream } from 'pdf-lib'

async function scanPage4() {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'Templates', 'PresupuestoStrong.pdf')
    const templateBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)
    const pages = pdfDoc.getPages()
    const page = pages[3]
    
    // We try to find text positions in the content stream
    // This is very low level and might fail if stream is compressed
    console.log('Scanning Page 4 content stream...')
    
    const { Contents } = (page as any).node.dict.entries()
    console.log('Contents type:', Contents.constructor.name)
    
  } catch (error) {
    console.error('Error scanning PDF:', error)
  }
}

scanPage4()
