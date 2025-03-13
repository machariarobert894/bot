import { standalone_routes } from '@/components/shared';
import { DerivLogo, useDevice } from '@deriv-com/ui';
import './app-logo.scss';

export const AppLogo = () => {
    const { isDesktop } = useDevice();

    if (!isDesktop) return null;
    return (
        <DerivLogo className='app-header__logo' href="https://binaryfx.site" target='_blank' variant='wallets' />
    );
};
