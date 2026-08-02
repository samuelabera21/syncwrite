import { Extension } from '@tiptap/core';

export interface IndentOptions {
    types: string[];
    minIndent: number;
    maxIndent: number;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        indent: {
            increaseIndent: () => ReturnType;
            decreaseIndent: () => ReturnType;
        };
    }
}

export const Indent = Extension.create<IndentOptions>({
    name: 'indent',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            minIndent: 0,
            maxIndent: 8,
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    indent: {
                        default: 0,
                        parseHTML: element => {
                            const paddingLeft = element.style.paddingLeft;
                            if (paddingLeft && paddingLeft.endsWith('rem')) {
                                return parseInt(paddingLeft.replace('rem', ''), 10);
                            }
                            return 0;
                        },
                        renderHTML: attributes => {
                            if (!attributes.indent || attributes.indent === 0) {
                                return {};
                            }
                            return { style: `padding-left: ${attributes.indent * 2}rem` };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            increaseIndent: () => ({ tr, state, dispatch }) => {
                const { selection } = state;
                let hasIndent = false;
                tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
                    if (this.options.types.includes(node.type.name)) {
                        const indent = node.attrs.indent || 0;
                        if (indent < this.options.maxIndent) {
                            tr.setNodeMarkup(pos, undefined, {
                                ...node.attrs,
                                indent: indent + 1,
                            });
                            hasIndent = true;
                        }
                    }
                });
                if (dispatch && hasIndent) {
                    dispatch(tr);
                    return true;
                }
                return false;
            },
            decreaseIndent: () => ({ tr, state, dispatch }) => {
                const { selection } = state;
                let hasIndent = false;
                tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
                    if (this.options.types.includes(node.type.name)) {
                        const indent = node.attrs.indent || 0;
                        if (indent > this.options.minIndent) {
                            tr.setNodeMarkup(pos, undefined, {
                                ...node.attrs,
                                indent: indent - 1,
                            });
                            hasIndent = true;
                        }
                    }
                });
                if (dispatch && hasIndent) {
                    dispatch(tr);
                    return true;
                }
                return false;
            },
        };
    },
});
