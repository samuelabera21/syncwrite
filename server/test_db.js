const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Y = require('yjs');

async function run() {
    const doc = await prisma.document.findFirst({
        orderBy: { lastModified: 'desc' }
    });
    console.log('Doc ID:', doc.id);
    console.log('DB Content Byte Length:', doc.content ? doc.content.length : 0);
    if (doc.content) {
        const ydoc = new Y.Doc();
        Y.applyUpdate(ydoc, new Uint8Array(doc.content));
        console.log('XML:', ydoc.getXmlFragment('default').toJSON());
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
