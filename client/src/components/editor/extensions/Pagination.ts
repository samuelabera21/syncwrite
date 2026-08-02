import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const PaginationPluginKey = new PluginKey('pagination');

export interface PaginationOptions {
    pageHeight: number;
}

export const Pagination = Extension.create<PaginationOptions>({
    name: 'pagination',

    addOptions() {
        return {
            pageHeight: 1056, // roughly 11 inches at 96 dpi
        };
    },

    addProseMirrorPlugins() {
        const pageHeight = this.options.pageHeight;

        return [
            new Plugin({
                key: PaginationPluginKey,
                state: {
                    init() {
                        return DecorationSet.empty;
                    },
                    apply(tr, set) {
                        const meta = tr.getMeta(PaginationPluginKey);
                        if (meta && meta.decorations !== undefined) {
                            return meta.decorations;
                        }
                        return set.map(tr.mapping, tr.doc);
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                },
                view: () => {
                    let timeout: any;

                    return {
                        update: (view, prevState) => {
                            if (view.state.doc.eq(prevState.doc)) {
                                return;
                            }

                            clearTimeout(timeout);
                            timeout = setTimeout(() => {
                                const decorations: Decoration[] = [];
                                let currentY = 0;
                                let pageCount = 1;

                                // We iterate over the top-level nodes of the document
                                const docAttrs = view.state.doc.attrs;
                                const startNum = typeof docAttrs.pageNumberStart === 'number' ? docAttrs.pageNumberStart : 1;
                                const formatType = docAttrs.pageNumberFormat || 'numeric';
                                
                                const formatNumber = (num: number, format: string) => {
                                    if (format === 'alphabetic') {
                                        return String.fromCharCode(64 + num); // A, B, C...
                                    } else if (format === 'roman') {
                                        const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
                                        return num <= 20 ? roman[num - 1] : num.toString();
                                    }
                                    return num.toString();
                                };

                                view.state.doc.forEach((node, offset) => {
                                    const dom = view.nodeDOM(offset);
                                    if (dom instanceof HTMLElement) {
                                        // Measure node height including margins
                                        const style = window.getComputedStyle(dom);
                                        const marginTop = parseFloat(style.marginTop) || 0;
                                        const marginBottom = parseFloat(style.marginBottom) || 0;
                                        const nodeHeight = dom.offsetHeight + marginTop + marginBottom;

                                        // If adding this node exceeds the current page
                                        if (currentY + nodeHeight > pageHeight * pageCount) {
                                            // Create a visual gap widget
                                            const gapWidget = document.createElement('div');
                                            gapWidget.className = 'editor-page-break';
                                            gapWidget.setAttribute('data-page-number', formatNumber(pageCount + startNum - 1, formatType));
                                            gapWidget.innerHTML = `<div class="editor-page-break-content"></div>`;
                                            
                                            decorations.push(
                                                Decoration.widget(offset, gapWidget, {
                                                    side: -1,
                                                    ignoreSelection: true
                                                })
                                            );
                                            
                                            // Reset Y relative to new page
                                            pageCount++;
                                            currentY = nodeHeight;
                                        } else {
                                            currentY += nodeHeight;
                                        }
                                    }
                                });

                                view.dom.setAttribute('data-first-page-number', formatNumber(startNum, formatType));
                                view.dom.setAttribute('data-total-pages', formatNumber(pageCount + startNum - 1, formatType));

                                const decorationSet = DecorationSet.create(view.state.doc, decorations);
                                
                                // Only dispatch if decorations changed
                                const currentSet = PaginationPluginKey.getState(view.state);
                                if (!currentSet || currentSet.find().length !== decorations.length) {
                                    view.dispatch(view.state.tr.setMeta(PaginationPluginKey, { decorations: decorationSet }));
                                }
                            }, 300);
                        },
                    };
                },
            }),
        ];
    },
});
