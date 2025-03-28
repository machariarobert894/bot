import { XmlHelper } from '@/XmlHelper';
import localForage from 'localforage';
import LZString from 'lz-string';
import { config } from '../constants';
import { save_types } from '../constants/save-type';
import DBotStore from '../scratch/dbot-store';

export const saveWorkspaceToRecent = async (xml, save_type = save_types.UNSAVED) => {
    const xml_dom = convertStrategyToIsDbot(xml);
    xml_dom.setAttribute('is_dbot', 'true');

    const {
        load_modal: { updateListStrategies },
        save_modal,
    } = DBotStore.instance;

    const workspace_id = window.Blockly.derivWorkspace.current_strategy_id || window.Blockly.utils.idGenerator.genUid();
    const workspaces = await getSavedWorkspaces();
    const current_xml = Blockly.Xml.domToText(xml_dom);

    const current_timestamp = Date.now();
    const current_workspace_index = workspaces.findIndex(workspace => workspace.id === workspace_id);

    if (current_workspace_index >= 0) {
        const current_workspace = workspaces[current_workspace_index];
        current_workspace.xml = XmlHelper.saveBotFormat(current_xml, {
            name: save_modal.bot_name,
            timestamp: current_timestamp,
        });
        current_workspace.name = save_modal.bot_name;
        current_workspace.timestamp = current_timestamp;
        current_workspace.save_type = save_type;
    } else {
        workspaces.push({
            id: workspace_id,
            timestamp: current_timestamp,
            name: save_modal.bot_name || config().default_file_name,
            xml: XmlHelper.saveBotFormat(current_xml, {
                name: save_modal.bot_name || config().default_file_name,
                timestamp: current_timestamp,
            }),
            save_type,
        });
    }

    workspaces.sort((a, b) => b.timestamp - a.timestamp);

    if (workspaces.length > 10) {
        workspaces.pop();
    }

    updateListStrategies(workspaces);
    await localForage.setItem('saved_workspaces', LZString.compress(JSON.stringify(workspaces)));
};

export const getSavedWorkspaces = async () => {
    try {
        const workspaces = JSON.parse(LZString.decompress(await localForage.getItem('saved_workspaces'))) || [];
        return workspaces.map(workspace => ({
            ...workspace,
            xml: XmlHelper.loadBotFormat(workspace.xml).blocksXml,
        }));
    } catch (e) {
        console.error('Error loading saved workspaces:', e);
        return [];
    }
};

export const removeExistingWorkspace = async workspace_id => {
    const workspaces = await getSavedWorkspaces();
    const current_workspace_index = workspaces.findIndex(workspace => workspace.id === workspace_id);

    if (current_workspace_index >= 0) {
        workspaces.splice(current_workspace_index, 1);
    }

    await localForage.setItem('saved_workspaces', LZString.compress(JSON.stringify(workspaces)));
};

export const convertStrategyToIsDbot = xml_dom => {
    if (!xml_dom) return;
    if (xml_dom.hasAttribute('collection') && xml_dom.getAttribute('collection') === 'true') {
        xml_dom.setAttribute('collection', 'true');
    }
    xml_dom.setAttribute('is_dbot', 'true');
    return xml_dom;
};
