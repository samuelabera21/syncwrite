import { Extension } from '@tiptap/core';
import toast from 'react-hot-toast';

export const KeyboardShortcuts = Extension.create({
    name: 'keyboardShortcuts',

    addKeyboardShortcuts() {
        return {
            'Mod-s': () => {
                toast.success('Document is autosaved securely');
                return true;
            },
            'Mod-p': () => {
                window.print();
                return true;
            },
            'Mod-f': () => {
                // Let browser handle find
                return false;
            },
        };
    },
});
