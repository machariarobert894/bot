import React, { useEffect } from 'react';
import classNames from 'classnames';
import { Field, Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import Button from '@/components/shared_ui/button';
import Input from '@/components/shared_ui/input';
import MobileFullPageModal from '@/components/shared_ui/mobile-full-page-modal';
import Modal from '@/components/shared_ui/modal';
import RadioGroup from '@/components/shared_ui/radio-group';
import Text from '@/components/shared_ui/text';
import ThemedScrollbars from '@/components/shared_ui/themed-scrollbars';
import { config, save_types } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import {
    DerivLightGoogleDriveIcon,
    DerivLightLocalDeviceIcon,
    DerivLightMyComputerIcon,
} from '@deriv/quill-icons/Illustration';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import IconRadio from './icon-radio';
import './save-modal.scss';

type TSaveModalForm = {
    bot_name: string;
    button_status: number;
    is_authorised: boolean;
    is_mobile?: boolean;
    is_onscreen_keyboard_active?: boolean;
    setCurrentFocus: (current_focus: string) => void;
    toggleSaveModal: () => void;
    validateBotName: (values: string) => { [key: string]: string };
};

const SaveModalForm: React.FC<TSaveModalForm> = ({
    bot_name,
    button_status,
    is_authorised,
    validateBotName,
    toggleSaveModal,
    is_mobile,
    is_onscreen_keyboard_active,
    setCurrentFocus,
}) => (
    <Formik
        initialValues={{
            is_local: true,
            save_as_collection: false,
            bot_name: bot_name === config().default_file_name ? '' : bot_name,
        }}
        validate={validateBotName}
        onSubmit={() => alert("You can not save this file.")}
    >
        {({ values: { is_local }, setFieldValue, touched, errors }) => {
            const content_height = !is_mobile ? '500px' : `calc(100%)`;
            return (
                <ThemedScrollbars height={content_height} autohide>
                    <Form className={classNames({ 'form--active-keyboard': is_onscreen_keyboard_active })}>
                        <div className='modal__content'>
                            <Text size='xs' lineHeight='l'>
                                {localize('Enter your bot name, choose to save on your computer or Google Drive, and hit ')}
                                <strong>{localize('Save.')}</strong>
                            </Text>
                            <div className='modal__content-row'>
                                <Field name='bot_name'>
                                    {({ field }) => (
                                        <Input
                                            className='save-type__input'
                                            type='text'
                                            placeholder={localize('Untitled Strategy')}
                                            error={touched[field.name] && errors[field.name]}
                                            label={localize('Bot name')}
                                            onFocus={e => setCurrentFocus(e.currentTarget.value)}
                                            onBlur={() => setCurrentFocus('')}
                                            {...field}
                                        />
                                    )}
                                </Field>
                            </div>
                        </div>
                        <div
                            className={classNames('modal__footer', {
                                'modal__footer--active-keyboard': is_onscreen_keyboard_active,
                            })}
                        >
                            <Button
                                type='button'
                                className='modal__footer--button'
                                text={localize('Cancel')}
                                onClick={toggleSaveModal}
                                secondary
                            />
                            <Button
                                className='modal__footer--button'
                                type='submit'
                                is_loading={button_status === 1}
                                is_submit_success={button_status === 2}
                                text={localize('Save')}
                                primary
                            />
                        </div>
                    </Form>
                </ThemedScrollbars>
            );
        }}
    </Formik>
);

const SaveModal = observer(() => {
    const { save_modal, google_drive, dashboard, load_modal, ui } = useStore();
    const { dashboard_strategies } = load_modal;
    const { button_status, bot_name, is_save_modal_open, toggleSaveModal, updateBotName, validateBotName } = save_modal;
    const { is_authorised } = google_drive;
    const { is_onscreen_keyboard_active, setCurrentFocus } = ui;
    const { isMobile } = useDevice();
    const { active_tab } = dashboard;

    useEffect(() => {
        if (active_tab === 1) {
            updateBotName(dashboard_strategies?.[0]?.name ?? '');
        }
    }, [active_tab, dashboard_strategies, updateBotName]);

    return isMobile ? (
        <MobileFullPageModal
            is_modal_open={is_save_modal_open}
            className='save-modal__wrapper'
            header={localize('Save strategy')}
            onClickClose={toggleSaveModal}
            height_offset='80px'
            page_overlay
        >
            <SaveModalForm
                bot_name={bot_name}
                button_status={button_status}
                is_authorised={is_authorised}
                validateBotName={validateBotName}
                toggleSaveModal={toggleSaveModal}
                is_mobile={isMobile}
                is_onscreen_keyboard_active={is_onscreen_keyboard_active}
                setCurrentFocus={setCurrentFocus}
            />
        </MobileFullPageModal>
    ) : (
        <Modal
            title={localize('Save strategy')}
            className='modal--save'
            width='32.8rem'
            height='50rem'
            is_open={is_save_modal_open}
            toggleModal={toggleSaveModal}
        >
            <SaveModalForm
                bot_name={bot_name}
                button_status={button_status}
                is_authorised={is_authorised}
                validateBotName={validateBotName}
                toggleSaveModal={toggleSaveModal}
                setCurrentFocus={setCurrentFocus}
            />
        </Modal>
    );
});

export default SaveModal;
