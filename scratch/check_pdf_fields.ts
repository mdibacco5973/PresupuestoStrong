import fs from 'fs/promises'
import path from 'path'
import { PDFDocument } from 'pdf-lib'

async function checkFields() {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'Templates', 'PresupuestoStrong.pdf')
    const templateBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    const fields = form.getFields()
    
    console.log('PDF Form Fields found:')
    fields.forEach(field => {
      console.log(`- ${field.getName()} (${field.constructor.name})`)
    })
  } catch (error) {
    console.error('Error checking PDF fields:', error)
  }
}

checkFields()
