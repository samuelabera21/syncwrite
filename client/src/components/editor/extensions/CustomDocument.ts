import Document from '@tiptap/extension-document';

export const CustomDocument = Document.extend({
    addAttributes() {
        return {
            pageNumberStyle: {
                default: null,
                parseHTML: element => element.getAttribute('data-page-number-style'),
                renderHTML: attributes => {
                    if (!attributes.pageNumberStyle) return {};
                    return { 'data-page-number-style': attributes.pageNumberStyle };
                },
            },
            pageNumberStart: {
                default: 1,
                parseHTML: element => parseInt(element.getAttribute('data-page-number-start') || '1', 10),
                renderHTML: attributes => {
                    return { 'data-page-number-start': attributes.pageNumberStart };
                },
            },
            pageNumberFormat: {
                default: 'numeric',
                parseHTML: element => element.getAttribute('data-page-number-format') || 'numeric',
                renderHTML: attributes => {
                    return { 'data-page-number-format': attributes.pageNumberFormat };
                },
            },
        };
    },
});
