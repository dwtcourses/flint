// src/redux/modules/editor/actions.ts

import * as types from './types';

export interface InitializeEditor {
    type: typeof types.INITIALIZE_EDITOR,
}

export function initializeEditor(): InitializeEditor {
    return {type: types.INITIALIZE_EDITOR}
}

export interface SetCurrentPage {
    type: typeof types.SET_CURRENT_PAGE,
    pageIndex: number
}

export function setCurrentPage(pageIndex: number): SetCurrentPage {
    return { type: types.SET_CURRENT_PAGE, pageIndex }
}

export interface SetProjectDir {
    type: typeof types.SET_PROJECT_DIR,
    value: string
}

export function setProjectDir(value: string): SetProjectDir {
    return {
        type: types.SET_PROJECT_DIR,
        value
    }
}

export type EditorAction = InitializeEditor | SetCurrentPage | SetProjectDir;
