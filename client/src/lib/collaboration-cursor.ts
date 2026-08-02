import { Extension } from "@tiptap/core";
import {
    yCursorPlugin,
    defaultSelectionBuilder,
    defaultCursorBuilder,
} from "@tiptap/y-tiptap";

export interface CollaborationCursorOptions {
    provider: any;
    user: {
        name: string;
        color: string;
    };
    render?: (user: { name: string; color: string }) => HTMLElement;
    selectionRender?: (user: { name: string; color: string }) => any;
}

const awarenessStatesToArray = (states: Map<number, any>) => {
    return Array.from(states.entries()).map(([key, value]) => {
        return {
            clientId: key,
            ...value.user,
        };
    });
};

export const CollaborationCursor = Extension.create<CollaborationCursorOptions>({
    name: "collaborationCursor",

    addOptions() {
        return {
            provider: null,
            user: {
                name: "Guest",
                color: "#6366f1",
            },
            render: defaultCursorBuilder,
            selectionRender: defaultSelectionBuilder,
        };
    },

    addStorage() {
        return {
            users: [] as any[],
        };
    },

    addCommands() {
        return {
            updateUser: (attributes: any) => () => {
                this.options.user = attributes;
                if (this.options.provider?.awareness) {
                    this.options.provider.awareness.setLocalStateField("user", this.options.user);
                }
                return true;
            },
        };
    },

    addProseMirrorPlugins() {
        if (!this.options.provider?.awareness) {
            return [];
        }

        const awareness = this.options.provider.awareness;

        awareness.setLocalStateField("user", this.options.user);
        this.storage.users = awarenessStatesToArray(awareness.states);

        awareness.on("update", () => {
            this.storage.users = awarenessStatesToArray(awareness.states);
        });

        return [
            yCursorPlugin(
                awareness,
                {
                    cursorBuilder: this.options.render,
                    selectionBuilder: this.options.selectionRender,
                }
            ),
        ];
    },
});
