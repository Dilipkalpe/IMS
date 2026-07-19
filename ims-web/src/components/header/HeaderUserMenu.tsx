import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthSession } from '../../api/auth';
import { NavKeys } from '../../navigation/navKeys';
import { useTheme } from '../../theme/ThemeProvider';
import type { AppThemeId } from '../../theme/types';
import { getUserInitials, getUserSubtitle } from './headerUserMenuUtils';
import './HeaderUserMenu.scss';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Low stock alert',
    message: 'Widget A-12 is below reorder level.',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    title: 'Purchase order approved',
    message: 'PO-2026-0142 was approved by admin.',
    time: '1 hr ago',
    read: false,
  },
  {
    id: '3',
    title: 'Backup completed',
    message: 'Scheduled database backup finished successfully.',
    time: 'Yesterday',
    read: true,
  },
];

export interface HeaderUserMenuProps {
  authSession: AuthSession | null;
  onNavigate: (navKey: string) => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
}

/** Top-right header cluster: theme badge, theme toggle, notifications, avatar menu. */
export function HeaderUserMenu({
  authSession,
  onNavigate,
  onLogout,
  onOpenProfile,
}: HeaderUserMenuProps) {
  const { theme, themes, setThemeId } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const rootRef = useRef<HTMLDivElement>(null);

  const hasUnread = notifications.some((item) => !item.read);

  const user = authSession?.user;
  const displayName = user?.fullName?.trim() || 'User';
  const subtitle = getUserSubtitle({
    email: user?.email,
    username: user?.username,
    role: user?.role,
  });
  const initials = getUserInitials(user?.fullName);

  const badgeStyle = useMemo(
    () => ({
      color: theme.palette.purple,
      background: `color-mix(in srgb, ${theme.palette.purple} 12%, #fff)`,
      border: `1px solid color-mix(in srgb, ${theme.palette.purple} 28%, #fff)`,
    }),
    [theme.palette.purple],
  );

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const closeAllPanels = useCallback(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen && !notificationsOpen) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeAllPanels();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAllPanels();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [closeAllPanels, menuOpen, notificationsOpen]);

  const toggleNotifications = useCallback(() => {
    setMenuOpen(false);
    setNotificationsOpen((open) => !open);
  }, []);

  const toggleMenu = useCallback(() => {
    setNotificationsOpen(false);
    setMenuOpen((open) => !open);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  }, []);

  const cycleTheme = useCallback(() => {
    const currentIndex = themes.findIndex((option) => option.id === theme.id);
    const next = themes[(currentIndex + 1) % themes.length];
    setThemeId(next.id as AppThemeId);
  }, [setThemeId, theme.id, themes]);

  const handleProfile = useCallback(() => {
    closeMenu();
    if (onOpenProfile) {
      onOpenProfile();
      return;
    }
    onNavigate(NavKeys.UserRoles);
  }, [closeMenu, onNavigate, onOpenProfile]);

  const handleSettings = useCallback(() => {
    closeMenu();
    onNavigate(NavKeys.Settings);
  }, [closeMenu, onNavigate]);

  const handleLogout = useCallback(() => {
    closeMenu();
    onLogout();
  }, [closeMenu, onLogout]);

  return (
    <div className="header-user-menu" ref={rootRef}>
      <span className="header-user-menu__badge" style={badgeStyle} aria-label="Current theme">
        {theme.badgeText}
      </span>

      <button
        type="button"
        className="header-user-menu__icon-btn"
        title={`Switch theme (current: ${theme.displayName})`}
        aria-label={`Switch theme, currently ${theme.displayName}`}
        onClick={cycleTheme}
      >
        <span className="icon-text">{'\uE708'}</span>
      </button>

      <div className="header-user-menu__notify-wrap">
        <button
          type="button"
          className={`header-user-menu__icon-btn${notificationsOpen ? ' header-user-menu__icon-btn--open' : ''}`}
          title="Notifications"
          aria-haspopup="dialog"
          aria-expanded={notificationsOpen}
          aria-label="Notifications"
          onClick={toggleNotifications}
        >
          <span className="icon-text">{'\uEA8F'}</span>
          {hasUnread ? <span className="header-user-menu__notify-dot" aria-hidden /> : null}
        </button>

        {notificationsOpen ? (
          <div
            className="header-user-menu__notifications-dropdown"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="header-user-menu__notifications-header">
              <h2 className="header-user-menu__notifications-title">Notifications</h2>
              {hasUnread ? (
                <button
                  type="button"
                  className="header-user-menu__notifications-mark-read"
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              ) : null}
            </div>

            {notifications.length === 0 ? (
              <p className="header-user-menu__notifications-empty">No new notifications</p>
            ) : (
              <ul className="header-user-menu__notifications-list" role="list">
                {notifications.map((item) => (
                  <li
                    key={item.id}
                    className={`header-user-menu__notification${item.read ? '' : ' header-user-menu__notification--unread'}`}
                  >
                    <p className="header-user-menu__notification-title">{item.title}</p>
                    <p className="header-user-menu__notification-message">{item.message}</p>
                    <p className="header-user-menu__notification-time">{item.time}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="header-user-menu__notifications-footer">
              <button
                type="button"
                className="header-user-menu__notifications-view-all"
                onClick={closeNotifications}
              >
                View all
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className={`header-user-menu__avatar${menuOpen ? ' header-user-menu__avatar--open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Account menu for ${displayName}`}
        onClick={toggleMenu}
      >
        {initials}
      </button>

      {menuOpen ? (
        <div className="header-user-menu__dropdown" role="menu" aria-label="User account menu">
          <div className="header-user-menu__dropdown-header">
            <p className="header-user-menu__dropdown-name">{displayName}</p>
            <p className="header-user-menu__dropdown-subtitle">{subtitle}</p>
          </div>

          <div className="header-user-menu__divider" role="separator" />

          <button type="button" role="menuitem" className="header-user-menu__item" onClick={handleProfile}>
            <span className="icon-text">{'\uE77B'}</span>
            <span>Profile</span>
          </button>

          <button type="button" role="menuitem" className="header-user-menu__item" onClick={handleSettings}>
            <span className="icon-text">{'\uE713'}</span>
            <span>Settings</span>
          </button>

          <div className="header-user-menu__divider" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="header-user-menu__item header-user-menu__item--danger"
            onClick={handleLogout}
          >
            <span className="icon-text">{'\uE7E8'}</span>
            <span>Logout</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default HeaderUserMenu;
