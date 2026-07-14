import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Dropdown, Button, Drawer } from 'antd';
import { UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { useCurrentUser } from '../hooks/useCurrentUser';

const { Header, Content } = AntLayout;

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/food', label: 'Nhật ký ăn uống' },
  { to: '/daily', label: 'Cân nặng & Nước' },
  { to: '/profile', label: 'Hồ sơ' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100'
  }`;

export function Layout({ children }: { children: React.ReactNode }) {
  const { userId, clearUser } = useCurrentUser();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: () => {
        clearUser();
        navigate('/login');
      },
    },
  ];

  const open = (to: string) => {
    setDrawerOpen(false);
    navigate(to);
  };

  return (
    <AntLayout className="min-h-screen bg-slate-50">
      <Header
        className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 shadow-sm sm:px-6"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'auto', lineHeight: 'normal', minHeight: 60 }}
      >
        <div className="flex items-center gap-2 sm:gap-6">
          <span
            className="cursor-pointer whitespace-nowrap text-lg font-bold text-emerald-600 sm:text-xl"
            onClick={() => navigate('/')}
          >
            Health Tracker
          </span>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {userId != null && (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Button type="text" icon={<UserOutlined />} className="!text-slate-600 hover:!bg-slate-100">
                Tài khoản
              </Button>
            </Dropdown>
          )}
          <Button
            type="text"
            aria-label="Mở menu"
            icon={<MenuOutlined />}
            className="!text-slate-600 md:hidden"
            onClick={() => setDrawerOpen(true)}
          />
        </div>
      </Header>

      <Drawer
        title="Menu"
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        <nav className="flex flex-col gap-1 p-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => open(l.to)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-3 text-sm font-medium ${
                  isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </Drawer>

      <Content
        className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {children}
      </Content>
    </AntLayout>
  );
}
