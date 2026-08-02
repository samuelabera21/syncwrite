import { prisma } from "../src/config/db";
import { createComment, updateComment, deleteComment } from "../src/controllers/comment.controller";
import { updateDocument, getDocuments } from "../src/controllers/document.controller";

function mockReq(userId: string, params: any = {}, body: any = {}, query: any = {}) {
    return {
        user: { id: userId },
        params,
        body,
        query
    } as any;
}

function mockRes() {
    const res: any = { statusCode: 200, data: null };
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.data = data;
        return res;
    };
    res.send = () => {
        return res;
    };
    return res;
}

async function runTests() {
    console.log("=== Testing Comments and Permissions ===");

    // Setup Test Data
    const owner = await prisma.user.create({ data: { name: "Owner", email: "owner@test.com" } });
    const commenter = await prisma.user.create({ data: { name: "Commenter", email: "commenter@test.com" } });
    const viewer = await prisma.user.create({ data: { name: "Viewer", email: "viewer@test.com" } });
    
    const doc = await prisma.document.create({ data: { title: "Test Doc", ownerId: owner.id } });
    
    await prisma.documentShare.createMany({
        data: [
            { documentId: doc.id, userId: commenter.id, role: "COMMENTER" },
            { documentId: doc.id, userId: viewer.id, role: "VIEWER" }
        ]
    });

    try {
        console.log("1. OWNER creates comment, replies, edits comment/reply, deletes reply, deletes comment.");
        
        let req = mockReq(owner.id, { id: doc.id }, { content: "Owner Comment" });
        let res = mockRes();
        await createComment(req, res);
        console.assert(res.statusCode === 201, "Owner should be able to create comment");
        const ownerComment = res.data.comment;

        req = mockReq(owner.id, { id: doc.id }, { content: "Owner Reply", parentId: ownerComment.id });
        res = mockRes();
        await createComment(req, res);
        console.assert(res.statusCode === 201, "Owner should be able to reply");
        const ownerReply = res.data.comment;

        req = mockReq(owner.id, { id: doc.id, commentId: ownerComment.id }, { content: "Edited Owner Comment" });
        res = mockRes();
        await updateComment(req, res);
        console.assert(res.statusCode === 200, "Owner should be able to edit comment");

        req = mockReq(owner.id, { id: doc.id, commentId: ownerReply.id });
        res = mockRes();
        await deleteComment(req, res);
        console.assert(res.statusCode === 204, "Owner should be able to delete reply");

        console.log("2. COMMENTER creates comment, replies, edits own comment/reply, deletes own comment/reply.");

        req = mockReq(commenter.id, { id: doc.id }, { content: "Commenter Comment" });
        res = mockRes();
        await createComment(req, res);
        console.assert(res.statusCode === 201, "Commenter should be able to create comment");
        const commenterComment = res.data.comment;

        req = mockReq(commenter.id, { id: doc.id }, { content: "Commenter Reply", parentId: commenterComment.id });
        res = mockRes();
        await createComment(req, res);
        console.assert(res.statusCode === 201, "Commenter should be able to reply");
        const commenterReply = res.data.comment;

        req = mockReq(commenter.id, { id: doc.id, commentId: commenterComment.id }, { content: "Edited Commenter Comment" });
        res = mockRes();
        await updateComment(req, res);
        console.assert(res.statusCode === 200, "Commenter should be able to edit own comment");

        req = mockReq(commenter.id, { id: doc.id, commentId: commenterReply.id });
        res = mockRes();
        await deleteComment(req, res);
        console.assert(res.statusCode === 204, "Commenter should be able to delete own reply");

        console.log("3. VIEWER is blocked (403) from creating comment, creating reply, editing comment, deleting comment.");
        
        req = mockReq(viewer.id, { id: doc.id }, { content: "Viewer Comment" });
        res = mockRes();
        await createComment(req, res);
        console.assert(res.statusCode === 403, "Viewer should be blocked from creating comment");

        req = mockReq(viewer.id, { id: doc.id, commentId: commenterComment.id }, { content: "Viewer Edit" });
        res = mockRes();
        await updateComment(req, res);
        console.assert(res.statusCode === 403, "Viewer should be blocked from editing comment");

        req = mockReq(viewer.id, { id: doc.id, commentId: commenterComment.id });
        res = mockRes();
        await deleteComment(req, res);
        console.assert(res.statusCode === 403, "Viewer should be blocked from deleting comment");

        console.log("4. COMMENTER is blocked (403) from editing document content.");
        
        req = mockReq(commenter.id, { id: doc.id }, { title: "New Title" });
        res = mockRes();
        await updateDocument(req, res);
        console.assert(res.statusCode === 403, "Commenter should be blocked from updating document title");

        console.log("5. Total comment count calculation matches database state.");
        
        req = mockReq(owner.id, {}, {}, { filter: "owned" });
        res = mockRes();
        await getDocuments(req, res);
        const docRes = res.data.documents.find((d: any) => d.id === doc.id);
        console.assert(docRes.commentCount === 2, `Total comment count should be 2 (owner comment and commenter comment). Found: ${docRes.commentCount}`);
        
        console.log("All tests passed successfully!");
    } finally {
        // Cleanup
        await prisma.comment.deleteMany({});
        await prisma.documentShare.deleteMany({});
        await prisma.document.deleteMany({});
        await prisma.user.deleteMany({
            where: { id: { in: [owner.id, commenter.id, viewer.id] } }
        });
    }
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
