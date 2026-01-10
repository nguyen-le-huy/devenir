
const fs = require('fs');
const path = require('path');

async function testVisualSearch() {
    try {
        const imagePath = path.resolve('/home/nguyenlehuy/Development/devenir/client/public/images/prd1.png');
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

        console.log('Sending request to PUBLIC visual search endpoint...');
        const publicUrl = 'https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api/image-search/find-similar';

        console.log(`URL: ${publicUrl}`);
        console.log(`Payload size: ${(base64Image.length / 1024 / 1024).toFixed(2)} MB`);

        const response = await fetch(publicUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: base64Image,
                topK: 5
            })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            console.error('Request failed:', response.statusText);
            const text = await response.text();
            console.error('Response body:', text);
            return;
        }

        const data = await response.json();
        console.log('Success:', data.success);
        console.log('Items found:', data.count);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testVisualSearch();
