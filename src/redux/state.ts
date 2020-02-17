// redux/state.ts
import {MVC} from "../constants/editor";
import {EditorData, SchemaData} from "@flintdev/model-editor/dist/interface";
import {FileTreeNode} from "../interface";

export interface EditorState {
    navigation: NavigationState,
    modelEditor: ModelEditorState,
    processEditor: ProcessEditorState,
}

export interface ConfigState {
    projectDir: string,
    currentPageIndex: number,
}

export interface NavigationState {
    currentView: string,
}

export interface ModelEditorState {
    modelList: Array<string>,
    modelSelected: string | undefined,
    editorData: EditorData | undefined,
    defaultEditorData: EditorData | undefined,
    schemaData: SchemaData | undefined,
    currentRevision: {
        editor: number | undefined,
        source: number | undefined,
    }
}

export interface ProcessEditorState {
    processList: string[],
    processSelected: string | undefined,
    processEditorDialog: {
        open: boolean,
        editorData: object | undefined,
    }
}

export interface FilesState {
    projectDir: string,
    treeData: FileTreeNode[],
    nodeSelected: FileTreeNode,
    fileContent: string|null,
}

export interface StoreState {
    starter: {
        createProjectDialog: object
    },
    config: ConfigState,
    editor: EditorState,
    files: FilesState,
}

export const initState: StoreState = {
    starter: {
        createProjectDialog: {
            open: false
        }
    },
    config: {
        projectDir: '',
        currentPageIndex: 0,
    },
    editor: {
        navigation: {
            currentView: MVC.Model,
        },
        modelEditor: {
            modelList: [],
            modelSelected: undefined,
            editorData: undefined,
            defaultEditorData: undefined,
            schemaData: undefined,
            currentRevision: {
                editor: undefined,
                source: undefined
            }
        },
        processEditor: {
            processList: [],
            processSelected: undefined,
            processEditorDialog: {
                open: false,
                editorData: undefined
            }
        }
    },
    files: {
        projectDir: '',
        treeData: undefined,
        nodeSelected: undefined,
        fileContent: '',
    }
};