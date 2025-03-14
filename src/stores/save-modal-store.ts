import localForage from 'localforage';
import LZString from 'lz-string';
import { action, makeObservable, observable } from 'mobx';
import { MAX_STRATEGIES } from '@/constants/bot-contents';
import { button_status } from '@/constants/button-status';
import {
    getSavedWorkspaces,
    observer as globalObserver,
    save,
    save_types,
    saveWorkspaceToRecent,
} from '@/external/bot-skeleton';
import { localize } from '@deriv-com/translations';
import { TStrategy } from 'Types';
import RootStore from './root-store';

type IOnConfirmProps = {
    is_local: boolean;
    save_as_collection: boolean;
    bot_name: string;
};

interface ISaveModalStore {
    is_save_modal_open: boolean;
    button_status: { [key: string]: string } | number;
    bot_name: { [key: string]: string } | string;
    toggleSaveModal: () => void;
    validateBotName: (values: string) => { [key: string]: string };
    onConfirmSave: ({ is_local, save_as_collection, bot_name }: IOnConfirmProps) => void;
    updateBotName: (bot_name: string) => void;
    setButtonStatus: (status: { [key: string]: string } | string | number) => void;
}

const Blockly = window.Blockly;

export default class SaveModalStore implements ISaveModalStore {
    root_store: RootStore;

    constructor(root_store: RootStore) {
        makeObservable(this, {
            is_save_modal_open: observable,
            button_status: observable,
            bot_name: observable,
            toggleSaveModal: action.bound,
            validateBotName: action.bound,
            onConfirmSave: action.bound,
            updateBotName: action.bound,
            onDriveConnect: action.bound,
            setButtonStatus: action.bound,
        });

        this.root_store = root_store;
    }
    is_save_modal_open = false;
    button_status = button_status.NORMAL;
    bot_name = '';

    toggleSaveModal = (): void => {
        if (!this.is_save_modal_open) {
            this.setButtonStatus(button_status.NORMAL);
        }
        this.is_save_modal_open = !this.is_save_modal_open;
    };

    validateBotName = (values: string): { [key: string]: string } => {
        const errors = {};
        if (values.trim() === '') {
            errors.bot_name = localize('Strategy name cannot be empty');
        }
        return errors;
    };

    onConfirmSave = async ({ is_local, save_as_collection, bot_name }: IOnConfirmProps) => {
        const { load_modal, dashboard, google_drive } = this.root_store;
        const { loadStrategyToBuilder, selected_strategy } = load_modal;
        const { active_tab } = dashboard;
        this.setButtonStatus(button_status.LOADING);
        const { saveFile } = google_drive;
        let xml;
        let main_strategy = null;

        if (active_tab === 1) {
            xml = Blockly?.Xml?.workspaceToDom(Blockly?.derivWorkspace);
        } else {
            const recent_files = await getSavedWorkspaces();
            main_strategy = recent_files.find((strategy: TStrategy) => strategy.id === selected_strategy.id);
            if (main_strategy) {
                main_strategy.name = bot_name;
                main_strategy.save_type = is_local ? save_types.LOCAL : save_types.GOOGLE_DRIVE;
                xml = Blockly.utils.xml.textToDom(main_strategy.xml);
            }
        }

        if (xml instanceof Element) {
            xml.setAttribute('is_dbot', 'true');
            xml.setAttribute('collection', save_as_collection ? 'true' : 'false');
        } else {
            console.error('Invalid XML structure:', xml);
            return;
        }

        const customContent = Blockly?.Xml?.domToPrettyText(xml);
        const customFileFormat = `<!CUSTOM_FORMAT_START>${customContent}<!CUSTOM_FORMAT_END>`;

        if (is_local) {
            save(bot_name, save_as_collection, customFileFormat);
        } else {
            await saveFile({
                name: bot_name,
                content: customFileFormat,
                mimeType: 'application/x-custom-format',
            });
            this.setButtonStatus(button_status.COMPLETED);
        }

        this.updateBotName(bot_name);
        if (active_tab === 0) {
            const workspace_id = selected_strategy?.id ?? Blockly?.utils?.genUid();
            await this.addStrategyToWorkspace(workspace_id, is_local, save_as_collection, bot_name, xml);
            if (main_strategy) await loadStrategyToBuilder(main_strategy);
        } else {
            await saveWorkspaceToRecent(xml, is_local ? save_types.LOCAL : save_types.GOOGLE_DRIVE);
        }
        this.toggleSaveModal();
    };

    updateBotName = (bot_name: string): void => {
        this.bot_name = bot_name;
    };

    onDriveConnect = async () => {
        const { google_drive } = this.root_store;
        if (google_drive.is_authorised) {
            google_drive.signOut();
        } else {
            google_drive.signIn();
        }
    };

    setButtonStatus = (status: { [key: string]: string } | string | number) => {
        this.button_status = status;
    };
}
