const fs = require('fs');
const pdf = require('pdf-parse');

async function findPositions() {
    let dataBuffer = fs.readFileSync('public/Templates/PresupuestoStrong.pdf');
    
    // Custom page render to see text items
    let options = {
        pagerender: function(pageData) {
            return pageData.getTextContent().then(function(textContent) {
                let text = '';
                textContent.items.forEach(item => {
                    if (item.str.includes('{FECHA}') || item.str.includes('{CLIENTE}') || item.str.includes('{DIRECCION}')) {
                        console.log(`FOUND: "${item.str}" at [${item.transform[4]}, ${item.transform[5]}] on page ${pageData.pageIndex + 1}`);
                    }
                });
                return text;
            });
        }
    };

    await pdf(dataBuffer, options);
}

findPositions();
