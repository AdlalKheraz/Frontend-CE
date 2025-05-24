import { createAvatar } from '@dicebear/core';
import { notionists } from '@dicebear/collection';

export const generateAvatar = (seed: string): string => {
    const avatar = createAvatar(notionists, {
        seed: seed,
        backgroundColor: [Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')],
    });

    return avatar.toDataUri();
}