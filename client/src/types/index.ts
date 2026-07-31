export interface DocumentItem {
    id: string;
    title: string;
    ownerId: string;
    createdAt: string;
    lastModified: string;
    owner: { name: string; email: string };
    shares: { userId: string; permission: string }[];
}
