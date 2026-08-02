import Document from '@tiptap/extension-document';

export const CustomDocument = Document.extend({
    addAttributes() {
        return {
            pageNumberStyle: {
                default: null,
                parseHTML: element => element.getAttribute('data-page-number-style'),
                renderHTML: attributes => {
                    if (!attributes.pageNumberStyle) {
                        return {};
                    }
                    return {
                        'data-page-number-style': attributes.pageNumberStyle,
                    };
                },
            },
        };
    },
});
