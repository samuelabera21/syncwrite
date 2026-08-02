import { Extension } from '@tiptap/core';

export interface LineSpacingOptions {
    types: string[];
    defaultSpacing: string;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        lineSpacing: {
            setLineSpacing: (spacing: string) => ReturnType;
            unsetLineSpacing: () => ReturnType;
        };
    }
}

export const LineSpacing = Extension.create<LineSpacingOptions>({
    name: 'lineSpacing',

    addOptions() {
        return {
            types: ['paragraph', 'heading', 'listItem'],
            defaultSpacing: 'normal',
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineSpacing: {
                        default: this.options.defaultSpacing,
                        parseHTML: element => element.style.lineHeight || this.options.defaultSpacing,
                        renderHTML: attributes => {
                            if (attributes.lineSpacing === this.options.defaultSpacing) {
                                return {};
                            }
                            return { style: `line-height: ${attributes.lineSpacing}` };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setLineSpacing: spacing => ({ commands }) => {
                return this.options.types.every(type => commands.updateAttributes(type, { lineSpacing: spacing }));
            },
            unsetLineSpacing: () => ({ commands }) => {
                return this.options.types.every(type => commands.resetAttributes(type, 'lineSpacing'));
            },
        };
    },
});
